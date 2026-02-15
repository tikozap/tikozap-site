// src/app/api/voice/transcribe/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";
  const callSessionId = url.searchParams.get("callSessionId") || "";

  if (!tenantId || !callSessionId) {
    return new NextResponse("Missing tenantId/callSessionId", { status: 400 });
  }

  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  const session = await prisma.callSession.findUnique({ where: { id: callSessionId } });
  if (!session || session.tenantId !== tenantId) {
    return new NextResponse("Unknown call session", { status: 404 });
  }

  // Twilio fields (commonly)
  const text =
    (params.TranscriptionText || params.Transcription || "").trim() || null;
  const transcriptionSid = params.TranscriptionSid || null;
  const status = (params.TranscriptionStatus || "").toLowerCase();

  // Update newest voicemail item for this call
  const item = await prisma.answerMachineItem.findFirst({
    where: { tenantId, callSessionId, type: "VOICEMAIL" },
    orderBy: { createdAt: "desc" },
  });

  if (item && text) {
    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: {
        transcriptText: text,
        status: "NEW",
      },
    });

    await prisma.message.create({
      data: {
        conversationId: session.conversationId,
        role: "assistant",
        content: `Voicemail transcript${transcriptionSid ? ` (${transcriptionSid})` : ""}: ${text}`,
      },
    });

    await prisma.conversation.update({
      where: { id: session.conversationId },
      data: { lastMessageAt: new Date() },
    });
  }

  // Always 200 so Twilio is happy
  return NextResponse.json({ ok: true, received: true, status });
}
