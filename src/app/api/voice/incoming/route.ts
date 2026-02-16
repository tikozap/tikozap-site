// src/app/api/voice/incoming/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
const VoiceResponse = twilio.twiml.VoiceResponse;

import { prisma } from "@/lib/prisma";
import { ensurePhoneConversation, addMessage } from "@/lib/answerMachine";
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";

export const runtime = "nodejs";

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

function normE164(v: string | null | undefined) {
  const s = (v || "").trim();
  if (!s) return null;
  // Twilio usually sends +E164 already. Keep it simple.
  return s.startsWith("+") ? s : `+${s.replace(/[^\d]/g, "")}`;
}

async function resolveTenantId(params: Record<string, string>, url: URL) {
  // Legacy support: allow tenantId query param (keep during migration)
  const tenantId = url.searchParams.get("tenantId") || "";
  if (tenantId && tenantId !== "YOUR_TENANT_ID") return tenantId;

  // New permanent way: map by inbound number (Twilio "To")
  const to = normE164(params.To || params.Called || "");
  if (!to) return null;

  const s = await prisma.phoneAgentSettings.findUnique({
    where: { inboundNumberE164: to },
    select: { tenantId: true },
  });

  return s?.tenantId || null;
}

async function handle(req: Request) {
  const url = new URL(req.url);

  // Twilio sends POST form fields
  let params: Record<string, string> = {};
  try {
    params = await readTwilioParams(req);
  } catch {
    // ignore
  }

  // Validate webhook signature (if enabled)
if (req.method === "POST") {
  try {
    const fullUrl = buildAbsoluteUrl(req);
    validateTwilioWebhookOrThrow({ req, params, fullUrl });
  } catch (e) {
    console.error("[voice/incoming] webhook validation failed:", e);
    const vr = new VoiceResponse();
    vr.say("Sorry, we could not verify this call request.");
    return xml(vr.toString());
  }
}

  const callSid = params.CallSid || `manual_${Date.now()}`;
  const from = normE164(params.From) || null;

  const tenantId = await resolveTenantId(params, url);

  const vr = new VoiceResponse();

  if (!tenantId) {
    vr.say(
      "This phone number is not connected to a TikoZap workspace yet. Please contact the store owner."
    );
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
    content: `Call started. provider=twilio callSid=${callSid} from=${from || "unknown"}`,
  });

  const session = await prisma.callSession.create({
    data: {
      tenantId,
      provider: "TWILIO",
      providerCallSid: callSid,
      fromNumber: from,
      toNumber: normE164(params.To || params.Called) || null,
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
  transcribe: false,  // ← disable Twilio transcription
  recordingStatusCallback: `${requireAppBaseUrl()}/api/voice/recording-status?tenantId=${tenantId}&callSessionId=${session.id}&reason=disabled`,
  recordingStatusCallbackMethod: "POST",
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

// Optional: browser testing remove after test
export async function GET(req: Request) {
  return handle(req);
}
