// src/app/api/webhooks/twilio/voice/route.ts
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import twilio from 'twilio';
const VoiceResponse = twilio.twiml.VoiceResponse;
import { prisma } from '@/lib/prisma';
import { ensurePhoneConversation, addMessage } from '../../../../../lib/answerMachine';
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from '@/lib/twilio/validate';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { trackMetric } from '@/lib/metrics';

export const runtime = 'nodejs';

function xml(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

function requireAppBaseUrl() {
  const base = (process.env.APP_BASE_URL || '').trim();
  return base || 'https://app.tikozap.com';
}

function normE164(v: string | null | undefined) {
  const s = (v || '').trim();
  if (!s) return null;
  return s.startsWith('+') ? s : `+${s.replace(/[^\d]/g, '')}`;
}

async function resolveTenantId(params: Record<string, string>, url: URL) {
  const tenantId = url.searchParams.get('tenantId') || '';
  if (tenantId && tenantId !== 'YOUR_TENANT_ID') return tenantId;

  const to = normE164(params.To || params.Called || '');
  if (!to) return null;

  const s = await prisma.phoneAgentSettings.findUnique({
    where: { inboundNumberE164: to },
    select: { tenantId: true },
  });
  return s?.tenantId || null;
}

// ── Cursor's excellent webhook verification ──
function safeEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
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

function verifyTwilioSignature(opts: {
  req: Request;
  rawBody: string;
  form: URLSearchParams | null;
}): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || '';
  const signature = opts.req.headers.get('x-twilio-signature') || '';
  if (!authToken || !signature) return false;

  for (const url of candidateUrls(opts.req)) {
    if (opts.form) {
      const sortedForm = new URLSearchParams([...opts.form.entries()].sort((a, b) => a[0].localeCompare(b[0])));
      const data = url + Array.from(sortedForm.entries()).map(([k, v]) => k + v).join('');
      if (safeEquals(signature, hmacSha1Base64(authToken, data))) return true;
    }
    if (safeEquals(signature, hmacSha1Base64(authToken, url + opts.rawBody))) return true;
  }
  return false;
}

function hmacSha1Base64(secret: string, data: string): string {
  return crypto.createHmac('sha1', secret).update(data, 'utf8').digest('base64');
}

function verifyWebhook(opts: {
  req: Request;
  rawBody: string;
  form: URLSearchParams | null;
}): { ok: boolean; mode: 'secret' | 'twilio_signature' | 'unverified'; error?: string } {
  const url = new URL(opts.req.url);
  const secretConfigured = process.env.TWILIO_WEBHOOK_SECRET?.trim() || '';
  const tokenConfigured = process.env.TWILIO_AUTH_TOKEN?.trim() || '';

  const secretCandidate =
    opts.req.headers.get('x-tikozap-webhook-secret') ||
    opts.req.headers.get('x-webhook-secret') ||
    url.searchParams.get('secret') ||
    '';

  const secretOk = !!secretConfigured && !!secretCandidate && safeEquals(secretCandidate, secretConfigured);
  if (secretOk) return { ok: true, mode: 'secret' };

  const twilioSigOk = verifyTwilioSignature(opts);
  if (twilioSigOk) return { ok: true, mode: 'twilio_signature' };

  if (secretConfigured || tokenConfigured) {
    return { ok: false, mode: 'unverified', error: 'Webhook verification failed.' };
  }

  return { ok: true, mode: 'unverified' };
}

// ── Your original business logic ──
export async function POST(req: Request) {
  const rate = checkRateLimit(req, {
    namespace: 'twilio-voice-webhook',
    limit: 240,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    await trackMetric({ source: 'twilio-webhook', event: 'rate_limited' });
    return NextResponse.json(
      { ok: false, error: 'Too many webhook requests.' },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error('[twilio/voice] Failed to read raw body');
  }

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  const form = contentType.includes('application/x-www-form-urlencoded')
    ? new URLSearchParams(rawBody)
    : null;

  const verify = verifyWebhook({ req, rawBody, form });

  if (!verify.ok) {
    await trackMetric({ source: 'twilio-webhook', event: 'verification_failed' });
    return NextResponse.json(
      { ok: false, error: verify.error || 'Unauthorized webhook request.' },
      { status: 401 },
    );
  }

  let params: Record<string, string> = {};
  try {
    params = Object.fromEntries(form?.entries() || []);
  } catch {
    // ignore
  }

  const url = new URL(req.url);
  const tenantId = await resolveTenantId(params, url);

  const vr = new VoiceResponse();

  if (!tenantId) {
    vr.say('This phone number is not connected to a TikoZap workspace yet. Please contact the store owner.');
    return xml(vr.toString());
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, storeName: true },
  });

  if (!tenant) {
    vr.say('Unknown tenant. Please contact the store owner.');
    return xml(vr.toString());
  }

  const settings = await prisma.phoneAgentSettings.findUnique({
    where: { tenantId },
  });

  const conversation = await ensurePhoneConversation({
    tenantId,
    fromNumber: normE164(params.From) || null,
    subject: `Phone call ${normE164(params.From) || ''}`.trim(),
  });

  await addMessage({
    conversationId: conversation.id,
    role: 'system',
    content: `Call started. provider=twilio callSid=${params.CallSid || 'unknown'} from=${normE164(params.From) || 'unknown'}`,
  });

  const session = await prisma.callSession.create({
    data: {
      tenantId,
      provider: 'TWILIO',
      providerCallSid: params.CallSid || `manual_${Date.now()}`,
      fromNumber: normE164(params.From) || null,
      toNumber: normE164(params.To || params.Called) || null,
      conversationId: conversation.id,
      status: 'IN_PROGRESS',
    },
  });

  const enabled = settings?.enabled ?? false;

  if (!enabled) {
    vr.say(settings?.fallbackLine || 'Sorry, please leave a message after the tone.');
    vr.record(recordWithTranscription({ tenantId, callSessionId: session.id, reason: 'disabled' }));
    return xml(vr.toString());
  }

  const greeting = settings?.greeting || 
    `Thanks for calling ${tenant.storeName}. How can I help you today?`;

  vr.say(greeting);

  vr.gather({
    input: ['speech'],
    action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${session.id}&turn=0`,
    method: 'POST',
    timeout: 10,
    speechTimeout: 'auto',
  });

  await trackMetric({ source: 'twilio-webhook', event: 'call_handled' });

  return xml(vr.toString());
}