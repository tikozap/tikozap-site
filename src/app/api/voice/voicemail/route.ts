// src/app/api/voice/voicemail/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";
const VoiceResponse = twilio.twiml.VoiceResponse;
import { buildAbsoluteUrl, readTwilioParams, validateTwilioWebhookOrThrow } from "@/lib/twilio/validate";
import { addMessage } from "@/lib/answerMachine";

export const runtime = "nodejs";

function xml(res: string) {
  return new NextResponse(res, { status: 200, headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";
  const callSessionId = url.searchParams.get("callSessionId") || "";
  const reason = url.searchParams.get("reason") || "voicemail";

  if (!tenantId || !callSessionId) return new NextResponse("Missing tenantId/callSessionId", { status: 400 });

  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  const recordingUrl = params.RecordingUrl || null;
  const recordingSid = params.RecordingSid || null;

  const session = await prisma.callSession.findUnique({ where: { id: callSessionId } });
  if (!session || session.tenantId !== tenantId) return new NextResponse("Unknown call session", { status: 404 });

  // Find the newest VOICEMAIL AnswerMachineItem for this call session
  const item = await prisma.answerMachineItem.findFirst({
    where: { callSessionId, tenantId, type: "VOICEMAIL" },
    orderBy: { createdAt: "desc" },
  });

  if (item) {
    await prisma.answerMachineItem.update({
      where: { id: item.id },
      data: {
        recordingUrl,
        transcriptText: null,
        status: "NEW",
        reason,
      },
    });
  }

  await addMessage({
    conversationId: session.conversationId,
    role: "user",
    content: `Voicemail received${recordingSid ? ` (recordingSid=${recordingSid})` : ""}. RecordingUrl: ${recordingUrl || "n/a"}`,
  });

  await prisma.callSession.update({
    where: { id: callSessionId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  const vr = new VoiceResponse();
  vr.say("Thanks. Your message has been recorded. Goodbye.");
  vr.hangup();
  return xml(vr.toString());
}
