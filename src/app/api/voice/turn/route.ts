// src/app/api/voice/turn/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";
const VoiceResponse = twilio.twiml.VoiceResponse;
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";
import { createAnswerMachineItem } from "@/lib/answerMachine";
import {
  looksLikeOrderStatusRequest,
  orderStatusCollectionReply,
} from "@/lib/voiceAgentPolicy";
import { storeAssistantReply } from "@/lib/assistant/storeAssistant";

export const runtime = "nodejs";

function xml(res: string) {
  return new NextResponse(res, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function requireAppBaseUrl() {
  const base = (process.env.APP_BASE_URL || "").trim();
  return base || "https://app.tikozap.com";
}

function recordWithTranscription(args: {
  tenantId: string;
  callSessionId: string;
  reason: string;
  maxLength?: number;
}) {
  return {
    action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${args.tenantId}&callSessionId=${args.callSessionId}&reason=${args.reason}`,
    method: "POST" as const,
    maxLength: args.maxLength ?? 180,
    playBeep: true,
    finishOnKey: "#",
    transcribe: false,
    recordingStatusCallback: `${requireAppBaseUrl()}/api/voice/recording-status?tenantId=${args.tenantId}&callSessionId=${args.callSessionId}&reason=${args.reason}`,
    recordingStatusCallbackMethod: "POST",
  };
}

async function addMessage(args: {
  conversationId: string;
  role: string;
  content: string;
}) {
  await prisma.message.create({
    data: {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
    },
  });
  await prisma.conversation.update({
    where: { id: args.conversationId },
    data: { lastMessageAt: new Date() },
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";
  const callSessionId = url.searchParams.get("callSessionId") || "";
  const turnStr = url.searchParams.get("turn") || "0";
  const turnIdx = Number.isFinite(Number(turnStr)) ? Number(turnStr) : 0;
  const MAX_TURNS = 6;

  if (!tenantId || !callSessionId) {
    return new NextResponse("Missing tenantId/callSessionId", { status: 400 });
  }

  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  const session = await prisma.callSession.findUnique({
    where: { id: callSessionId },
    include: { tenant: true },
  });

  if (!session || session.tenantId !== tenantId) {
    return new NextResponse("Unknown call session", { status: 404 });
  }

  const settings = await prisma.phoneAgentSettings.findUnique({
    where: { tenantId },
  });

  const vr = new VoiceResponse();
  const digits = (params.Digits || "").trim();
  const speech = (params.SpeechResult || "").trim();
  const from = params.From || session.fromNumber || null;

  // Max turns fallback
  if (turnIdx >= MAX_TURNS) {
    vr.say("To help you faster, please leave a message after the tone.");
    vr.record(recordWithTranscription({ tenantId, callSessionId, reason: "max_turns" }));
    const xmlResponse = xml(vr.toString());

    (async () => {
      try {
        await prisma.callSession.update({
          where: { id: callSessionId },
          data: { fallbackTriggeredAt: new Date() },
        });
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: "VOICEMAIL",
          fromNumber: from,
          reason: "max_turns",
        });
      } catch (err) {
        console.error("[voice/turn] Background max_turns task failed:", err);
      }
    })();

    return xmlResponse;
  }

  // DTMF 0 → voicemail (fast path)
  if (digits === "0") {
    vr.say("Please leave a message after the tone. When you're done, press pound.");
    vr.record(recordWithTranscription({ tenantId, callSessionId, reason: "dtmf_0" }));
    const xmlResponse = xml(vr.toString());

    (async () => {
      try {
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: "VOICEMAIL",
          fromNumber: from,
          reason: "dtmf_0",
        });
      } catch (err) {
        console.error("[voice/turn] Background DTMF 0 task failed:", err);
      }
    })();

    return xmlResponse;
  }

  // DTMF 1 → callback request
  if (digits === "1") {
    vr.say("Thanks. We received your callback request. We'll reach out as soon as possible. Goodbye.");
    vr.hangup();

    const xmlResponse = xml(vr.toString());

    (async () => {
      try {
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: "CALLBACK",
          fromNumber: from,
          reason: "dtmf_1",
          callbackNumber: from,
          callbackNotes: "Callback requested via DTMF 1.",
        });
        await addMessage({
          conversationId: session.conversationId,
          role: "customer",
          content: "Callback requested (DTMF 1).",
        });
        await addMessage({
          conversationId: session.conversationId,
          role: "assistant",
          content: "Thanks — we received your callback request. Our team will reach out as soon as possible.",
        });
        await prisma.callSession.update({
          where: { id: callSessionId },
          data: { status: "COMPLETED", endedAt: new Date() },
        });
      } catch (err) {
        console.error("[voice/turn] Background DTMF 1 task failed:", err);
      }
    })();

    return xmlResponse;
  }

  // No speech input
  if (!speech) {
    if (turnIdx >= 1) {
      // Second failure → offer voicemail/callback options
      vr.say(
        "Sorry, I didn't catch that. Would you like to leave a message? Press 0 to leave a voicemail, or press 1 to request a callback."
      );
      vr.gather({
        input: ["speech", "dtmf"],
        numDigits: 1,
        action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
        method: "POST",
        timeout: 6,
      });

      const xmlResponse = xml(vr.toString());

      (async () => {
        try {
          await prisma.callSession.update({
            where: { id: callSessionId },
            data: { fallbackTriggeredAt: new Date() },
          });
          await createAnswerMachineItem({
            tenantId,
            conversationId: session.conversationId,
            callSessionId,
            type: "VOICEMAIL",
            fromNumber: from,
            reason: "timeout",
          });
        } catch (err) {
          console.error("[voice/turn] Background timeout task failed:", err);
        }
      })();

      return xmlResponse;
    }

    // First timeout → natural reprompt
    vr.say("Sorry — I didn't catch that. How can I help you?");
    vr.gather({
      input: ["speech"],
      action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
      method: "POST",
      timeout: 8,
      speechTimeout: "auto",
    });
    return xml(vr.toString());
  }

  // Save caller speech
  await addMessage({
    conversationId: session.conversationId,
    role: "customer",
    content: speech,
  });

  // Generate assistant reply
  let assistantText = "";
  const started = Date.now();
  try {
    if (looksLikeOrderStatusRequest(speech)) {
      assistantText = orderStatusCollectionReply();
    } else {
      assistantText = await storeAssistantReply({
        tenantId,
        conversationId: session.conversationId,
        userText: speech,
        channel: "phone",
      });
    }
  } catch (e) {
    console.error("[voice/turn] storeAssistantReply failed; fallback", e);

    vr.say("Sorry — please leave a message after the tone.");
    vr.record(recordWithTranscription({ tenantId, callSessionId, reason: "model_error" }));

    const xmlResponse = xml(vr.toString());

    (async () => {
      try {
        await prisma.callSession.update({
          where: { id: callSessionId },
          data: { fallbackTriggeredAt: new Date() },
        });
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: "VOICEMAIL",
          fromNumber: from,
          reason: "model_error",
        });
      } catch (err) {
        console.error("[voice/turn] Background model_error task failed:", err);
      }
    })();

    return xmlResponse;
  }

  const llmMs = Date.now() - started;

  try {
    await prisma.callTurn.upsert({
      where: { callSessionId_idx: { callSessionId, idx: turnIdx } },
      create: {
        callSessionId,
        idx: turnIdx,
        sttText: speech,
        assistantText,
        llmMs,
      },
      update: {
        sttText: speech,
        assistantText,
        llmMs,
      },
    });
  } catch (e) {
    console.warn("[voice/turn] failed to upsert callTurn", e);
  }

  await addMessage({
    conversationId: session.conversationId,
    role: "assistant",
    content: assistantText,
  });

  vr.say(assistantText);
  vr.gather({
    input: ["speech", "dtmf"],
    action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
    method: "POST",
    timeout: 6,
    speechTimeout: "auto",
    actionOnEmptyResult: true,
  });

  return xml(vr.toString());
}