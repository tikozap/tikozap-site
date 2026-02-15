// src/app/api/voice/voicemail/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";
const VoiceResponse = twilio.twiml.VoiceResponse;

import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";

import { addMessage, createAnswerMachineItem, attachVoicemailRecording } from "@/lib/answerMachine";
import { fetchTwilioRecording } from "@/lib/twilio/fetchRecording";
import { transcribeAudio } from "@/lib/openai/transcribe";

export const runtime = "nodejs";

function xml(res: string) {
  return new NextResponse(res, { status: 200, headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";
  const callSessionId = url.searchParams.get("callSessionId") || "";
  const reason = url.searchParams.get("reason") || "voicemail";

  if (!tenantId || !callSessionId) {
    return new NextResponse("Missing tenantId/callSessionId", { status: 400 });
  }

  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  const recordingUrl = params.RecordingUrl || null;
  const recordingSid = params.RecordingSid || null;
  const from = params.From || null;

  const session = await prisma.callSession.findUnique({ where: { id: callSessionId } });
  if (!session || session.tenantId !== tenantId) {
    return new NextResponse("Unknown call session", { status: 404 });
  }

  // Ensure we have an AnswerMachineItem to attach to (sometimes callers hit voicemail without DTMF)
  let item = await prisma.answerMachineItem.findFirst({
    where: { callSessionId, tenantId, type: "VOICEMAIL" },
    orderBy: { createdAt: "desc" },
  });

  if (!item) {
    item = await createAnswerMachineItem({
      tenantId,
      conversationId: session.conversationId,
      callSessionId,
      type: "VOICEMAIL",
      fromNumber: from,
      reason,
    });
  }

  // Always save RecordingUrl first
  await attachVoicemailRecording({
    answerMachineItemId: item.id,
    recordingUrl,
    transcriptText: null,
  });

  await addMessage({
    conversationId: session.conversationId,
    role: "user",
    content: `Voicemail received${recordingSid ? ` (recordingSid=${recordingSid})` : ""}. RecordingUrl: ${recordingUrl || "n/a"}`,
  });

  // Try transcription (best-effort). If it fails, we still succeed overall.
  let transcript = "";
  try {
    if (recordingUrl) {
      const rec = await fetchTwilioRecording(recordingUrl);
      transcript = await transcribeAudio({
        bytes: rec.bytes,
        filename: rec.filename,
        contentType: rec.contentType,
      });
    }
  } catch (e) {
    console.warn("[voice/voicemail] transcription failed", e);
  }

  if (transcript) {
    await attachVoicemailRecording({
      answerMachineItemId: item.id,
      recordingUrl,
      transcriptText: transcript,
    });

    await addMessage({
      conversationId: session.conversationId,
      role: "assistant",
      content: `Voicemail transcript: ${transcript}`,
    });
  }

  await prisma.callSession.update({
    where: { id: callSessionId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  const vr = new VoiceResponse();
  vr.say("Thanks. Your message has been recorded. Goodbye.");
  vr.hangup();
  return xml(vr.toString());
}
