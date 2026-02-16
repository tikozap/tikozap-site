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
    // Fetch audio (Twilio allows .mp3 extension for MP3 format)
    const audioFetchUrl = `${recordingUrl}.mp3`;
    const audioResponse = await fetch(audioFetchUrl);
    if (!audioResponse.ok) {
      throw new Error(`Audio fetch failed: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    const audioBuffer = await audioResponse.arrayBuffer();

   // Whisper transcription
const transcription = await openai.audio.transcriptions.create({
  file: new File([audioBuffer], `voicemail-${recordingSid || Date.now()}.mp3`, { type: "audio/mp3" }),
  model: "gpt-4o-mini-transcribe", // or "whisper-1"
  response_format: "text",
  // language: "en",               // uncomment if calls are mostly English
  // prompt: "Customer voicemail about e-commerce: orders, shipping, returns, sizing.", // helps accuracy
});

const transcript = transcription.trim() || "";

if (!transcript) {
  throw new Error("Empty transcription result");
}

    // Update DB
    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: {
        transcriptText: transcript,
        status: "DONE",
        updatedAt: new Date(),
      },
    });

// Add to inbox as customer message (visible in dashboard)
const convId = item.conversationId || item.callSession?.conversationId;

if (!convId) {
  console.warn("[recording-status] Skipping message creation: no conversationId found");
  // Still return success since transcription worked
} else {
  await prisma.message.create({
    data: {
      conversationId: convId,  // now TS knows it's string
      role: "customer",
      content: `[Voicemail transcribed]: ${transcript}`,
    },
  });

  await prisma.conversation.update({
    where: { id: convId },
    data: { lastMessageAt: new Date() },
  });
}

    console.log("[recording-status] Success - transcript:", transcript.substring(0, 100));
    return NextResponse.json({ success: true, transcript });
  } catch (error) {
    console.error("[recording-status] Whisper error:", error);
    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}