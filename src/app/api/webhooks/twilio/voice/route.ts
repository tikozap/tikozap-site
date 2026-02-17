import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { trackMetric } from '@/lib/metrics';
import { ingestTwilioVoiceEvent } from '@/lib/twilioVoiceEvents';

export const runtime = 'nodejs';

type VerifyMode = 'secret' | 'twilio_signature' | 'unverified';

type VerifyResult = {
  ok: boolean;
  mode: VerifyMode;
  error?: string;
};

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

function signatureForForm(authToken: string, url: string, form: URLSearchParams): string {
  const entries = Array.from(form.entries()).sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });
  let data = url;
  for (const [key, value] of entries) {
    data += key + value;
  }
  return hmacSha1Base64(authToken, data);
}

function signatureForBody(authToken: string, url: string, rawBody: string): string {
  return hmacSha1Base64(authToken, url + rawBody);
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
      const expectedForm = signatureForForm(authToken, url, opts.form);
      if (safeEquals(signature, expectedForm)) return true;
    }

    const expectedBody = signatureForBody(authToken, url, opts.rawBody);
    if (safeEquals(signature, expectedBody)) return true;
  }

  return false;
}

function verifyWebhook(opts: {
  req: Request;
  rawBody: string;
  form: URLSearchParams | null;
}): VerifyResult {
  const url = new URL(opts.req.url);
  const secretConfigured = process.env.TWILIO_WEBHOOK_SECRET?.trim() || '';
  const tokenConfigured = process.env.TWILIO_AUTH_TOKEN?.trim() || '';

  const secretCandidate =
    opts.req.headers.get('x-tikozap-webhook-secret') ||
    opts.req.headers.get('x-webhook-secret') ||
    url.searchParams.get('secret') ||
    '';

  const secretOk =
    !!secretConfigured &&
    !!secretCandidate &&
    safeEquals(secretCandidate, secretConfigured);
  if (secretOk) return { ok: true, mode: 'secret' };

  const twilioSigOk = verifyTwilioSignature(opts);
  if (twilioSigOk) return { ok: true, mode: 'twilio_signature' };

  if (secretConfigured || tokenConfigured) {
    return {
      ok: false,
      mode: 'unverified',
      error: 'Webhook verification failed.',
    };
  }

  return {
    ok: true,
    mode: 'unverified',
  };
}

function parsePayload(rawBody: string, contentType: string): {
  payload: unknown;
  form: URLSearchParams | null;
} {
  if (!rawBody) return { payload: {}, form: null };

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = new URLSearchParams(rawBody);
    const obj: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      const prev = obj[key];
      if (prev === undefined) {
        obj[key] = value;
      } else if (Array.isArray(prev)) {
        obj[key] = [...prev, value];
      } else {
        obj[key] = [prev, value];
      }
    }
    return { payload: obj, form };
  }

  if (contentType.includes('application/json')) {
    const parsed = JSON.parse(rawBody);
    return { payload: parsed, form: null };
  }

  try {
    const parsed = JSON.parse(rawBody);
    return { payload: parsed, form: null };
  } catch {
    return { payload: { rawBody }, form: null };
  }
}

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

  try {
    const rawBody = await req.text();
    const contentType = (req.headers.get('content-type') || '').toLowerCase();
    const parsed = parsePayload(rawBody, contentType);
    const verify = verifyWebhook({
      req,
      rawBody,
      form: parsed.form,
    });

    if (!verify.ok) {
      await trackMetric({ source: 'twilio-webhook', event: 'verification_failed' });
      return NextResponse.json(
        { ok: false, error: verify.error || 'Unauthorized webhook request.' },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const tenantIdHint = url.searchParams.get('tenantId') || undefined;
    const tenantSlugHint = url.searchParams.get('tenantSlug') || undefined;

    const { event } = await ingestTwilioVoiceEvent({
      payload: parsed.payload,
      rawPayload: rawBody.length > 120_000 ? rawBody.slice(0, 120_000) : rawBody,
      verification: verify.mode,
      tenantIdHint,
      tenantSlugHint,
    });

    await trackMetric({
      source: 'twilio-webhook',
      event: 'ingested',
      tenantId: event.tenantId || undefined,
    });
    if (verify.mode === 'unverified') {
      await trackMetric({ source: 'twilio-webhook', event: 'ingested_unverified' });
    }

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      verification: event.verification,
      eventType: event.eventType,
      callSid: event.callSid,
      metrics: {
        mos: event.mos,
        jitterMs: event.jitterMs,
        packetLossPct: event.packetLossPct,
        roundTripMs: event.roundTripMs,
      },
      createdAt: event.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in Twilio voice webhook', error);
    await trackMetric({ source: 'twilio-webhook', event: 'ingest_failed' });
    return NextResponse.json(
      { ok: false, error: 'Failed to ingest Twilio webhook payload.' },
      { status: 500 },
    );
  }
}
