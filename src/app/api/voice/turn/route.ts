// src/app/api/voice/turn/route.ts
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { createAnswerMachineItem } from '@/lib/answerMachine';
import { storeAssistantReply } from '@/lib/assistant/storeAssistant';
import { looksLikeOrderStatusRequest, orderStatusCollectionReply } from '@/lib/voiceAgentPolicy';

export const runtime = 'nodejs';

const VoiceResponse = twilio.twiml.VoiceResponse;

function xml(body: string) {
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

function requireAppBaseUrl() {
  const base = (process.env.APP_BASE_URL || '').trim();
  return base || 'https://app.tikozap.com';
}

function recordWithTranscription(args: {
  tenantId: string;
  callSessionId: string;
  reason: string;
  maxLength?: number;
}) {
  return {
    action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${args.tenantId}&callSessionId=${args.callSessionId}&reason=${args.reason}`,
    method: 'POST' as const,
    maxLength: args.maxLength ?? 180,
    playBeep: true,
    finishOnKey: '#',
    transcribe: false,
    recordingStatusCallback: `${requireAppBaseUrl()}/api/voice/recording-status?tenantId=${args.tenantId}&callSessionId=${args.callSessionId}&reason=${args.reason}`,
    recordingStatusCallbackMethod: 'POST',
  };
}

/* ───────── webhook verification (same spirit as your hardened webhook) ───────── */

function safeEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hmacSha1Base64(secret: string, data: string): string {
  return crypto.createHmac('sha1', secret).update(data, 'utf8').digest('base64');
}

function candidateUrls(req: Request): string[] {
  const original = new URL(req.url);
  const urls = new Set<string>([original.toString()]);

  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || original.protocol.replace(':', '');
  if (!forwardedHost) return Array.from(urls);

  const hostNoPort = forwardedHost.replace(/:443$|:80$/, '');
  urls.add(`${forwardedProto}://${forwardedHost}${original.pathname}${original.search}`);
  urls.add(`${forwardedProto}://${hostNoPort}${original.pathname}${original.search}`);

  return Array.from(urls);
}

function verifyTwilioSignature(opts: { req: Request; rawBody: string; form: URLSearchParams | null }): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || '';
  const signature = opts.req.headers.get('x-twilio-signature') || '';
  if (!authToken || !signature) return false;

  for (const url of candidateUrls(opts.req)) {
    // Twilio signature is usually URL + sorted POST params
    if (opts.form) {
      const sortedForm = new URLSearchParams([...opts.form.entries()].sort((a: any, b: any) => a[0].localeCompare(b[0])));
      const data = url + Array.from(sortedForm.entries()).map(([k, v]: any) => k + v).join('');
      if (safeEquals(signature, hmacSha1Base64(authToken, data))) return true;
    }
    // fallback attempt
    if (safeEquals(signature, hmacSha1Base64(authToken, url + opts.rawBody))) return true;
  }

  return false;
}

function verifyWebhook(opts: { req: Request; rawBody: string; form: URLSearchParams | null }) {
  const url = new URL(opts.req.url);
  const secretConfigured = process.env.TWILIO_WEBHOOK_SECRET?.trim() || '';
  const tokenConfigured = process.env.TWILIO_AUTH_TOKEN?.trim() || '';

  const secretCandidate =
    opts.req.headers.get('x-tikozap-webhook-secret') ||
    opts.req.headers.get('x-webhook-secret') ||
    url.searchParams.get('secret') ||
    '';

  const secretOk = !!secretConfigured && !!secretCandidate && safeEquals(secretCandidate, secretConfigured);
  if (secretOk) return { ok: true as const, mode: 'secret' as const };

  const twilioSigOk = verifyTwilioSignature(opts);
  if (twilioSigOk) return { ok: true as const, mode: 'twilio_signature' as const };

  if (secretConfigured || tokenConfigured) {
    return { ok: false as const, mode: 'unverified' as const, error: 'Webhook verification failed.' };
  }

  // dev-only allow if nothing configured
  return { ok: true as const, mode: 'unverified' as const };
}

/* ───────── tiny helpers ───────── */

async function addMsg(conversationId: string, role: string, content: string) {
  await prisma.message.create({ data: { conversationId, role, content } });
  await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') || '';
  const callSessionId = url.searchParams.get('callSessionId') || '';
  const turnStr = url.searchParams.get('turn') || '0';
  const turnIdx = Number.isFinite(Number(turnStr)) ? Number(turnStr) : 0;

  const MAX_TURNS = 6;

  const vr = new VoiceResponse();

  if (!tenantId || !callSessionId) {
    vr.say('Missing tenantId or callSessionId.');
    return xml(vr.toString());
  }

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {}

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  const form = contentType.includes('application/x-www-form-urlencoded') ? new URLSearchParams(rawBody) : null;

  const verify = verifyWebhook({ req, rawBody, form });
  if (!verify.ok) {
    vr.say('Sorry, we could not verify this request.');
    return xml(vr.toString());
  }

  const params: Record<string, string> = Object.fromEntries(form?.entries() || []);

  const session = await prisma.callSession.findUnique({
    where: { id: callSessionId },
    include: { tenant: true },
  });

  if (!session || session.tenantId !== tenantId) {
    vr.say('Unknown call session.');
    return xml(vr.toString());
  }

  const settings = await prisma.phoneAgentSettings.findUnique({ where: { tenantId } });

  const digits = (params.Digits || '').trim();
  const speech = (params.SpeechResult || '').trim();
  const from = (params.From || session.fromNumber || '').trim() || null;

  // Max turns fallback
  if (turnIdx >= MAX_TURNS) {
    vr.say('To help you faster, please leave a message after the tone.');
    vr.record(recordWithTranscription({ tenantId, callSessionId, reason: 'max_turns' }));

    // background bookkeeping
    (async () => {
      try {
        await prisma.callSession.update({ where: { id: callSessionId }, data: { fallbackTriggeredAt: new Date() } });
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: 'VOICEMAIL',
          fromNumber: from,
          reason: 'max_turns',
        });
      } catch (e) {
        console.error('[voice/turn] max_turns bookkeeping failed', e);
      }
    })();

    return xml(vr.toString());
  }

  // DTMF 0 → voicemail (fast path)
  if (digits === '0') {
    vr.say("Please leave a message after the tone. When you're done, press pound.");
    vr.record(recordWithTranscription({ tenantId, callSessionId, reason: 'dtmf_0' }));

    (async () => {
      try {
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: 'VOICEMAIL',
          fromNumber: from,
          reason: 'dtmf_0',
        });
      } catch (e) {
        console.error('[voice/turn] dtmf_0 bookkeeping failed', e);
      }
    })();

    return xml(vr.toString());
  }

  // DTMF 1 → callback request
  if (digits === '1') {
    vr.say("Thanks. We received your callback request. We'll reach out as soon as possible. Goodbye.");
    vr.hangup();

    (async () => {
      try {
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: 'CALLBACK',
          fromNumber: from,
          reason: 'dtmf_1',
          callbackNumber: from,
          callbackNotes: 'Callback requested via DTMF 1.',
        });

        await addMsg(session.conversationId, 'customer', 'Callback requested (DTMF 1).');
        await addMsg(session.conversationId, 'assistant', "Thanks — we received your callback request. Our team will reach out as soon as possible.");

        await prisma.callSession.update({
          where: { id: callSessionId },
          data: { status: 'COMPLETED', endedAt: new Date() },
        });
      } catch (e) {
        console.error('[voice/turn] dtmf_1 bookkeeping failed', e);
      }
    })();

    return xml(vr.toString());
  }

  // No speech input
  if (!speech) {
    if (turnIdx >= 1) {
      const fallbackPrompt =
        settings?.fallbackLine ||
        "Sorry, I didn't catch that. Press 0 to leave a voicemail, or press 1 to request a callback.";

      vr.say(fallbackPrompt);
      vr.gather({
        input: ['speech', 'dtmf'],
        numDigits: 1,
        action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
        method: 'POST',
        timeout: 6,
      });

      (async () => {
        try {
          await prisma.callSession.update({ where: { id: callSessionId }, data: { fallbackTriggeredAt: new Date() } });
          await createAnswerMachineItem({
            tenantId,
            conversationId: session.conversationId,
            callSessionId,
            type: 'VOICEMAIL',
            fromNumber: from,
            reason: 'timeout',
          });
        } catch (e) {
          console.error('[voice/turn] timeout bookkeeping failed', e);
        }
      })();

      return xml(vr.toString());
    }

    // First timeout → natural reprompt
    vr.say("Sorry — I didn't catch that. How can I help you?");
    vr.gather({
      input: ['speech'],
      action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
      method: 'POST',
      timeout: 8,
      speechTimeout: 'auto',
    });

    return xml(vr.toString());
  }

  // Save caller speech into thread
  await addMsg(session.conversationId, 'customer', speech);

  // Generate assistant reply
  let assistantText = '';
  const started = Date.now();
  try {
    assistantText = looksLikeOrderStatusRequest(speech)
      ? orderStatusCollectionReply()
      : await storeAssistantReply({
          tenantId,
          conversationId: session.conversationId,
          userText: speech,
          channel: 'phone',
        });
  } catch (e) {
    console.error('[voice/turn] storeAssistantReply failed; fallback', e);

    vr.say('Sorry — please leave a message after the tone.');
    vr.record(recordWithTranscription({ tenantId, callSessionId, reason: 'model_error' }));

    (async () => {
      try {
        await prisma.callSession.update({ where: { id: callSessionId }, data: { fallbackTriggeredAt: new Date() } });
        await createAnswerMachineItem({
          tenantId,
          conversationId: session.conversationId,
          callSessionId,
          type: 'VOICEMAIL',
          fromNumber: from,
          reason: 'model_error',
        });
      } catch (err) {
        console.error('[voice/turn] model_error bookkeeping failed', err);
      }
    })();

    return xml(vr.toString());
  }

  const llmMs = Date.now() - started;

  // store per-turn metrics (optional)
  try {
    await prisma.callTurn.upsert({
      where: { callSessionId_idx: { callSessionId, idx: turnIdx } },
      create: { callSessionId, idx: turnIdx, sttText: speech, assistantText, llmMs },
      update: { sttText: speech, assistantText, llmMs },
    });
  } catch (e) {
    console.warn('[voice/turn] failed to upsert callTurn', e);
  }

  await addMsg(session.conversationId, 'assistant', assistantText);

  vr.say(assistantText);
  vr.gather({
    input: ['speech', 'dtmf'],
    action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${callSessionId}&turn=${turnIdx + 1}`,
    method: 'POST',
    timeout: 6,
    speechTimeout: 'auto',
    actionOnEmptyResult: true,
  });

  return xml(vr.toString());
}