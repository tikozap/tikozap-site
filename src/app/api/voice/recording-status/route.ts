// src/app/api/voice/recording-status/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);

  try {
    validateTwilioWebhookOrThrow({ req, params, fullUrl });
  } catch (e) {
    console.error("[recording-status] Validation failed:", e);
    return new NextResponse("Invalid webhook", { status: 403 });
  }

  const status = params.RecordingStatus?.toLowerCase();
  if (status !== "completed") {
    return NextResponse.json({ ok: true }); // Ignore other statuses for now
  }

  const recordingUrl = params.RecordingUrl as string | undefined;
  const recordingSid = params.RecordingSid as string | undefined;
  const callSid = params.CallSid as string | undefined;

  if (!recordingUrl || !callSid) {
    console.warn("[recording-status] Missing required params");
    return NextResponse.json({ ok: true });
  }

  // Find the most recent unanswered VOICEMAIL item for this call
  const item = await prisma.answerMachineItem.findFirst({
    where: {
      callSession: { providerCallSid: callSid },
      type: "VOICEMAIL",
      status: { in: ["NEW", "IN_PROGRESS"] }, // Only process fresh ones
    },
    orderBy: { createdAt: "desc" },
    include: { callSession: { select: { conversationId: true } } },
  });

  if (!item) {
    console.log("[recording-status] No matching voicemail item for callSid:", callSid);
    return NextResponse.json({ ok: true });
  }

  // Skip if already transcribed (idempotent)
  if (item.transcriptText && item.transcriptText.trim().length > 5) {
    console.log("[recording-status] Already transcribed, skipping");
    return NextResponse.json({ ok: true });
  }

try {
  console.log("[recording-status] Fetching audio from:", audioFetchUrl); // debug

  const audioResponse = await fetch(audioFetchUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
    },
  });

  if (!audioResponse.ok) {
    const errorText = await audioResponse.text().catch(() => 'No error body');
    throw new Error(`Audio fetch failed: ${audioResponse.status} ${audioResponse.statusText} - ${errorText}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();

  // Whisper transcription
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBuffer], `voicemail-${recordingSid || Date.now()}.mp3`, { type: "audio/mp3" }),
    model: "gpt-4o-mini-transcribe",
    response_format: "text",
  });

  const transcript = transcription.trim() || "";

  if (!transcript) {
    throw new Error("Empty transcription result");
  }

  // Update DB, add message, etc. (your existing code)
  console.log("[recording-status] Transcribed successfully:", transcript.substring(0, 100));
} catch (error) {
  console.error("[recording-status] Whisper error:", error.message || error);
  await prisma.answerMachineItem.update({
    where: { id: item.id },
    data: { status: "FAILED" },
  });
  return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
}
}