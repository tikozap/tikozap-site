// src/app/api/voice/incoming/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { ensurePhoneConversation, addMessage } from "@/lib/answerMachine";
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";

export const runtime = "nodejs";
const VoiceResponse = twilio.twiml.VoiceResponse;

function xml(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function requireAppBaseUrl() {
  const base = (process.env.APP_BASE_URL || "").trim();
  return base || "https://app.tikozap.com";
}

function normalizeE164(v: string | null | undefined) {
  const s = (v || "").trim();
  if (!s) return null;
  // Twilio typically sends +E164 already; keep it simple
  return s;
}

async function resolveTenantId(args: {
  explicitTenantId?: string | null;
  toNumber?: string | null;
}): Promise<string | null> {
  // 1) explicit tenantId (for manual testing / curl)
  if (args.explicitTenantId && args.explicitTenantId !== "YOUR_TENANT_ID") {
    const t = await prisma.tenant.findUnique({
      where: { id: args.explicitTenantId },
      select: { id: true },
    });
    if (t) return t.id;
  }

  // 2) lookup by inbound number
  const to = normalizeE164(args.toNumber);
  if (!to) return null;

  const s = await prisma.phoneAgentSettings.findUnique({
    where: { inboundNumberE164: to },
    select: { tenantId: true },
  });

  return s?.tenantId || null;
}

async function handle(req: Request) {
  const url = new URL(req.url);

  // If browser GET, formData will be empty; this endpoint is meant for POST from Twilio
  const params = await readTwilioParams(req).catch(() => ({} as Record<string, string>));

  // If you have validation enabled, enforce it (Twilio POSTs include the signature header)
  try {
    const fullUrl = buildAbsoluteUrl(req);
    validateTwilioWebhookOrThrow({ req, params, fullUrl });
  } catch (e) {
    // If you prefer to hard-fail, replace this with `throw e;`
    console.warn("[voice/incoming] webhook validation skipped/failed:", e);
  }

  const from = normalizeE164(params.From) || null;
  const to = normalizeE164(params.To) || null;
  const callSid = params.CallSid || `manual_${Date.now()}`;

  const explicitTenantId = url.searchParams.get("tenantId");
  const tenantId = await resolveTenantId({ explicitTenantId, toNumber: to });

  const vr = new VoiceResponse();

  if (!tenantId) {
    vr.say("TikoZap voice webhook is configured, but we could not identify the store for this number.");
    return xml(vr.toString());
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, storeName: true },
  });

  if (!tenant) {
    vr.say("Unknown tenant. Please contact the store owner.");
    return xml(vr.toString());
  }

  const settings = await prisma.phoneAgentSettings.findUnique({
    where: { tenantId },
  });

  const conversation = await ensurePhoneConversation({
    tenantId,
    fromNumber: from,
    subject: `Phone call ${from || ""}`.trim(),
  });

  await addMessage({
    conversationId: conversation.id,
    role: "system",
    content: `Call started. provider=twilio callSid=${callSid} from=${from || "unknown"} to=${to || "unknown"}`,
  });

  const session = await prisma.callSession.create({
    data: {
      tenantId,
      provider: "TWILIO",
      providerCallSid: callSid,
      fromNumber: from,
      toNumber: to,
      conversationId: conversation.id,
      status: "IN_PROGRESS",
    },
  });

  const enabled = settings?.enabled ?? false;

  if (!enabled) {
    vr.say(settings?.fallbackLine || "Sorry, please leave a message after the tone.");
    vr.record({
      action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${session.id}&reason=disabled`,
      method: "POST",
      maxLength: 120,
      playBeep: true,
      finishOnKey: "#",
    });
    return xml(vr.toString());
  }

  const greeting =
    settings?.greeting ||
    `Thanks for calling ${tenant.storeName}. How can I help you today? You can press 0 to leave a message, or press 1 to request a callback.`;

  vr.say(greeting);

  vr.gather({
    input: ["speech", "dtmf"],
    action: `${requireAppBaseUrl()}/api/voice/turn?tenantId=${tenantId}&callSessionId=${session.id}&turn=0`,
    method: "POST",
    timeout: 6,
    speechTimeout: "auto",
  });

  return xml(vr.toString());
}

export async function POST(req: Request) {
  return handle(req);
}

// Optional: keep GET for quick browser checks, but Twilio uses POST.
// You can remove this later.
export async function GET(req: Request) {
  return handle(req);
}
