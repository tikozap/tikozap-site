// src/app/api/voice/recording-status/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads"; // ✅ add
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
  if (status !== "completed") return NextResponse.json({ ok: true });

  const recordingUrl = params.RecordingUrl as string | undefined;
  const recordingSid = params.RecordingSid as string | undefined;
  const callSid = params.CallSid as string | undefined;

  if (!recordingUrl || !callSid) return NextResponse.json({ ok: true });

  const item = await prisma.answerMachineItem.findFirst({
    where: {
      callSession: { providerCallSid: callSid },
      type: "VOICEMAIL",
      status: { in: ["NEW", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
    include: { callSession: { select: { conversationId: true } } },
  });

  if (!item) return NextResponse.json({ ok: true });

  if (item.transcriptText && item.transcriptText.trim().length > 5) {
    return NextResponse.json({ ok: true });
  }

  try {
    const audioFetchUrl = `${recordingUrl}.mp3`;

    const audioResponse = await fetch(audioFetchUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text().catch(() => "");
      throw new Error(`Audio fetch failed: ${audioResponse.status} ${errorText}`);
    }

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    const file = await toFile(audioBuffer, `voicemail-${recordingSid || Date.now()}.mp3`, {
      type: "audio/mpeg",
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      response_format: "text",
    });

    const transcript = (transcription || "").trim();
    if (!transcript) throw new Error("Empty transcription result");

    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: { transcriptText: transcript, status: "DONE" },
    });

    const convoId = item.callSession?.conversationId;
    if (convoId) {
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

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[recording-status] Transcription failed:", error?.message || error);
    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: { status: "FAILED" },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
}