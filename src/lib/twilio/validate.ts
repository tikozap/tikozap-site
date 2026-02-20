// src/lib/twilio/validate.ts
import crypto from 'node:crypto';

function firstHeaderValue(v: string | null): string {
  if (!v) return '';
  return v.split(',')[0]?.trim() || '';
}

function safeEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hmacSha1Base64(secret: string, data: string): string {
  return crypto.createHmac('sha1', secret).update(data, 'utf8').digest('base64');
}

function computeTwilioSignature(authToken: string, url: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k}${params[k] ?? ''}`)
    .join('');

  return hmacSha1Base64(authToken, url + sorted);
}

/**
 * Best-effort "public URL" for this request, including query string.
 * Twilio signature includes query string if it exists in the configured URL.
 */
export function buildAbsoluteUrl(req: Request): string {
  const u = new URL(req.url);

  const xfHost = firstHeaderValue(req.headers.get('x-forwarded-host'));
  const xfProto = firstHeaderValue(req.headers.get('x-forwarded-proto'));

  const proto = (xfProto || u.protocol.replace(':', '') || 'https').toLowerCase();
  const host = (xfHost || u.host || '').trim();

  const pathAndQuery = `${u.pathname}${u.search}`;
  if (host) return `${proto}://${host}${pathAndQuery}`;

  return `${u.origin}${pathAndQuery}`;
}

function candidateUrls(req: Request, preferredFullUrl?: string): string[] {
  const u = new URL(req.url);
  const urls = new Set<string>();

  // 1) What the runtime thinks (may be vercel internal)
  urls.add(`${u.origin}${u.pathname}${u.search}`);

  // 2) Preferred computed public URL
  if (preferredFullUrl) urls.add(preferredFullUrl);

  // 3) Forwarded host/proto (first value only)
  const forwardedHostRaw = firstHeaderValue(req.headers.get('x-forwarded-host'));
  const forwardedProto = firstHeaderValue(req.headers.get('x-forwarded-proto')) || u.protocol.replace(':', '');

  if (forwardedHostRaw) {
    const forwardedHost = forwardedHostRaw.trim();
    const hostNoPort = forwardedHost.replace(/:443$|:80$/, '');
    urls.add(`${forwardedProto}://${forwardedHost}${u.pathname}${u.search}`);
    urls.add(`${forwardedProto}://${hostNoPort}${u.pathname}${u.search}`);
  }

  // 4) If you have APP_BASE_URL, add it as a candidate too (very helpful)
  const appBase = (process.env.APP_BASE_URL || '').trim();
  if (appBase) {
    urls.add(`${appBase.replace(/\/$/, '')}${u.pathname}${u.search}`);
  }

  return Array.from(urls);
}

export async function readTwilioParams(req: Request): Promise<Record<string, string>> {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') params[key] = value;
  }
  return params;
}

export function validateTwilioWebhookOrThrow(opts: {
  req: Request;
  params: Record<string, string>;
  fullUrl?: string;
}) {
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  if (!authToken) throw new Error('TWILIO_AUTH_TOKEN not set');

  const signature = firstHeaderValue(opts.req.headers.get('x-twilio-signature'));
  if (!signature) throw new Error('Missing x-twilio-signature header');

  const urls = candidateUrls(opts.req, opts.fullUrl);

  for (const url of urls) {
    const computed = computeTwilioSignature(authToken, url, opts.params);
    if (safeEquals(computed, signature)) return; // ✅ verified
  }

  throw new Error('Twilio signature validation failed');
}