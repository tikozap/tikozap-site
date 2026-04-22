// src/app/api/voice/recording-status/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { prisma } from "@/lib/prisma";
import { buildAbsoluteUrl, readTwilioParams, validateTwilioWebhookOrThrow } from "@/lib/twilio/validate";

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

  const status = (params.RecordingStatus || "").toLowerCase();
  if (status !== "completed") {
    console.log("[recording-status] Ignoring non-completed status:", status);
    return NextResponse.json({ ok: true });
  }

  const recordingUrl = params.RecordingUrl as string | undefined;
  const recordingSid = params.RecordingSid as string | undefined;
  const callSid = params.CallSid as string | undefined;

  if (!recordingUrl || !callSid) {
    console.log("[recording-status] Missing required params:", { recordingUrl, callSid });
    return NextResponse.json({ ok: true });
  }

  const item = await prisma.answerMachineItem.findFirst({
    where: {
      callSession: { providerCallSid: callSid },
      type: "VOICEMAIL",
      status: { in: ["NEW", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
    include: { callSession: { select: { conversationId: true } } },
  });

  if (!item) {
    console.log("[recording-status] No matching voicemail item found for callSid:", callSid);
    return NextResponse.json({ ok: true });
  }

  // Skip if already transcribed
  if (item.transcriptText && item.transcriptText.trim().length > 5) {
    console.log("[recording-status] Transcription already exists, skipping");
    return NextResponse.json({ ok: true });
  }

  try {
    const audioFetchUrl = `${recordingUrl}.mp3`;
    console.log("[recording-status] Fetching audio from:", audioFetchUrl);

    const audioResponse = await fetch(audioFetchUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text().catch(() => "");
      throw new Error(`Audio fetch failed: ${audioResponse.status} - ${errorText}`);
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const file = await toFile(audioBuffer, `voicemail-${recordingSid || Date.now()}.mp3`, {
      type: "audio/mpeg",
    });

    console.log("[recording-status] Sending audio to Whisper for transcription...");

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });

    const transcript = (transcription || "").trim();
    console.log("[recording-status] Whisper transcription result:", transcript);

    if (!transcript) {
      throw new Error("Empty transcription result from Whisper");
    }

    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: { transcriptText: transcript, status: "DONE" },
    });

    const convoId = item.callSession?.conversationId;
    if (convoId) {
      console.log("[recording-status] Adding transcribed message to conversation:", convoId);
      await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: convoId,
            role: "customer",
            content: transcript,
          },
        }),
        prisma.conversation.update({
          where: { id: convoId },
          data: { lastMessageAt: new Date() },
        }),
      ]);
    }

    console.log("[recording-status] Transcription success for item:", item.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[recording-status] Transcription failed:", error?.message || error);
    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: { status: "FAILED" },
    }).catch(() => {});
    return NextResponse.json({ ok: true }); // still 200 to Twilio
  }
}