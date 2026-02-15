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

async function addMessage(args: {
  conversationId: string;
  role: string; // your DB uses free-form strings
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

if (turnIdx >= MAX_TURNS) {
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

  vr.say("To help you faster, please leave a message after the tone.");
  vr.record({
    action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${callSessionId}&reason=max_turns`,
    method: "POST",
    maxLength: 180,
    playBeep: true,
    finishOnKey: "#",

// ✅ Twilio transcription
  transcribe: true,
  transcribeCallback: `${requireAppBaseUrl()}/api/voice/transcribe?tenantId=${tenantId}&callSessionId=${callSessionId}`,
});

  return xml(vr.toString());
}

  // --------------------
  // DTMF routes
  // --------------------
  if (digits === "0") {
    await createAnswerMachineItem({
      tenantId,
      conversationId: session.conversationId,
      callSessionId,
      type: "VOICEMAIL",
      fromNumber: from,
      reason: "dtmf_0",
    });

    await addMessage({
      conversationId: session.conversationId,
      role: "system",
      content: "Caller pressed 0 → voicemail handoff.",
    });

    vr.say("Please leave a message after the tone. When you're done, press pound.");
    vr.record({
      action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${callSessionId}&reason=dtmf_0`,
      method: "POST",
      maxLength: 180,
      playBeep: true,
      finishOnKey: "#",
    });
    return xml(vr.toString());
  }

  if (digits === "1") {
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


    vr.say("Thanks. We received your callback request. We'll reach out as soon as possible. Goodbye.");
    await prisma.callSession.update({
    where: { id: callSessionId },
    data: { status: "COMPLETED", endedAt: new Date() },
});
    vr.hangup();
    return xml(vr.toString());
  }

  // --------------------
  // No input: reprompt once, then fallback to voicemail
  // --------------------
  if (!speech) {
    if (turnIdx >= 1) {
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

      vr.say(settings?.fallbackLine || "Sorry — I didn't catch that. Please leave a message after the tone.");
      vr.record({
        action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${callSessionId}&reason=timeout`,
        method: "POST",
        maxLength: 180,
        playBeep: true,
        finishOnKey: "#",
      });
      return xml(vr.toString());
    }

    vr.say("Sorry — I didn't catch that. Please tell me how I can help. You can also press 0 to leave a message, or press 1 to request a callback.");
    vr.gather({
      input: ["speech", "dtmf"],
      action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
      method: "POST",
      timeout: 6,
      speechTimeout: "auto",
    });
    return xml(vr.toString());
  }

  // --------------------
  // Save caller speech to Inbox
  // --------------------
  await addMessage({
    conversationId: session.conversationId,
    role: "customer",
    content: speech,
  });

  // --------------------
  // Generate assistant reply (policy gate)
  // --------------------
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

    vr.say(settings?.fallbackLine || "Sorry — please leave a message after the tone.");
    vr.record({
      action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${callSessionId}&reason=model_error`,
      method: "POST",
      maxLength: 180,
      playBeep: true,
      finishOnKey: "#",
    });
    return xml(vr.toString());
  }

  const llmMs = Date.now() - started;

// Traceability: save CallTurn with idx = turnIdx (idempotent)
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

  // Speak + gather next input
  vr.say(assistantText);
  vr.gather({
    input: ["speech", "dtmf"],
    action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
    method: "POST",
    timeout: 6,
    speechTimeout: "auto",
  });

  return xml(vr.toString());
}
