// src/lib/twilio/validate.ts
import twilio from "twilio";

function truthy(v: string | undefined) {
  return (v || "").toLowerCase() === "true" || v === "1" || v === "yes";
}

export function buildAbsoluteUrl(req: Request): string {
  // Vercel/Proxies: use forwarded headers when present
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) throw new Error("Missing host header for webhook URL reconstruction");

  const url = new URL(req.url);
  return `${proto}://${host}${url.pathname}${url.search}`;
}

export async function readTwilioParams(req: Request): Promise<Record<string, string>> {
  // Twilio typically posts application/x-www-form-urlencoded
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);
  return params;
}

export function validateTwilioWebhookOrThrow(args: {
  req: Request;
  params: Record<string, string>;
  fullUrl: string;
}) {
  const shouldValidate = truthy(process.env.TWILIO_WEBHOOK_VALIDATE);
  if (!shouldValidate) return;

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) throw new Error("TWILIO_AUTH_TOKEN missing but validation enabled");

  const signature =
    args.req.headers.get("x-twilio-signature") || args.req.headers.get("X-Twilio-Signature");
  if (!signature) throw new Error("Missing X-Twilio-Signature header");

  const ok = twilio.validateRequest(authToken, signature, args.fullUrl, args.params);
  if (!ok) throw new Error("Twilio webhook signature validation failed");
}
