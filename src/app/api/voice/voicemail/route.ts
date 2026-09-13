// src/app/api/voice/voicemail/route.ts
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { buildAbsoluteUrl, readTwilioParams, validateTwilioWebhookOrThrow } from '@/lib/twilio/validate';
import { attachVoicemailRecording, createAnswerMachineItem, addMessage } from '@/lib/answerMachine';

export const runtime = 'nodejs';
const VoiceResponse = twilio.twiml.VoiceResponse;

function xml(body: string) {
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || '';
  const callSessionId = url.searchParams.get('callSessionId') || '';
  const reason = url.searchParams.get('reason') || 'voicemail';

  if (!tenantId || !callSessionId) {
    return new NextResponse('Missing tenantId/callSessionId', { status: 400 });
  }

  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  const recordingUrl = (params.RecordingUrl || '').trim() || null;
  const recordingSid = (params.RecordingSid || '').trim() || null;
  const from = (params.From || '').trim() || null;

  const session = await prisma.callSession.findUnique({ where: { id: callSessionId } });
  if (!session || session.tenantId !== tenantId) {
    return new NextResponse('Unknown call session', { status: 404 });
  }

  // Ensure AnswerMachineItem exists
  let item = await prisma.answerMachineItem.findFirst({
    where: { callSessionId, tenantId, type: 'VOICEMAIL' },
    orderBy: { createdAt: 'desc' },
  });

  if (!item) {
    item = await createAnswerMachineItem({
      tenantId,
      conversationId: session.conversationId,
      callSessionId,
      type: 'VOICEMAIL',
      fromNumber: from,
      reason,
    });
  }

  // Store recording URL (transcription will be handled in recording-status)
  await attachVoicemailRecording({
    answerMachineItemId: item.id,
    recordingUrl,
    transcriptText: null,
  });

  // IMPORTANT: use roles your Inbox understands
  await addMessage({
    conversationId: session.conversationId,
    role: 'customer',
    content: `Left a voicemail. (Transcribing now…)`,
  });

  await prisma.callSession.update({
    where: { id: callSessionId },
    data: { status: 'COMPLETED', endedAt: new Date() },
  });

  const vr = new VoiceResponse();
  vr.say('Thanks. Your message has been recorded. Goodbye.');
  vr.hangup();
  return xml(vr.toString());
}