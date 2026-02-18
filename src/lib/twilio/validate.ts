// src/lib/twilio/validate.ts
import { twiml } from 'twilio';
import crypto from 'crypto';

export function buildAbsoluteUrl(req: Request) {
  const url = new URL(req.url);
  return url.origin + url.pathname;
}

export async function readTwilioParams(req: Request): Promise<Record<string, string>> {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      params[key] = value;
    }
  }
  return params;
}

export function validateTwilioWebhookOrThrow(opts: {
  req: Request;
  params: Record<string, string>;
  fullUrl: string;
}) {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!authToken) throw new Error('TWILIO_AUTH_TOKEN not set');

  const signature = opts.req.headers.get('x-twilio-signature') || '';
  if (!signature) throw new Error('Missing x-twilio-signature header');

  const url = opts.fullUrl;
  const sortedParams = Object.keys(opts.params)
    .sort()
    .map(key => `${key}${opts.params[key]}`)
    .join('');

  const data = url + sortedParams;
  const computedSig = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64');

  if (computedSig !== signature) {
    throw new Error('Twilio signature validation failed');
  }
}