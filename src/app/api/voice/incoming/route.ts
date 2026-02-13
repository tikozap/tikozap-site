// src/app/api/voice/incoming/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
const VoiceResponse = twilio.twiml.VoiceResponse;

import { prisma } from "@/lib/prisma";
import {
  buildAbsoluteUrl,
  readTwilioParams,
  validateTwilioWebhookOrThrow,
} from "@/lib/twilio/validate";
import { ensurePhoneConversation, addMessage, createAnswerMachineItem } from "@/lib/answerMachine";

export const runtime = "nodejs";

function xml(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

// --------------------
// Business hours helpers
// --------------------
type HoursMap = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", [string, string][]>
>;

function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s || "").trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function getLocalDayAndMinutes(tz: string): { day: keyof HoursMap; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekday = (parts.find((p) => p.type === "weekday")?.value || "Mon").toLowerCase();
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");

  const map: Record<string, keyof HoursMap> = {
    mon: "mon",
    tue: "tue",
    wed: "wed",
    thu: "thu",
    fri: "fri",
    sat: "sat",
    sun: "sun",
  };

  const key = map[weekday.slice(0, 3)] || "mon";
  return { day: key, minutes: hour * 60 + minute };
}

function isWithinBusinessHours(args: {
  businessHoursJson?: string | null;
  timeZone?: string | null;
  tzFallback: string;
}): { ok: boolean; tz: string } {
  const tz = args.timeZone || args.tzFallback || "America/New_York";

  // No hours set => treat as always open (MVP)
  const raw = (args.businessHoursJson || "").trim();
  if (!raw) return { ok: true, tz };

  let parsed: HoursMap | null = null;
  try {
    parsed = JSON.parse(raw) as HoursMap;
  } catch {
    // Invalid JSON => don't block calls
    return { ok: true, tz };
  }

  const { day, minutes } = getLocalDayAndMinutes(tz);
  const ranges = (parsed?.[day] || []) as [string, string][];

  // Empty => closed
  if (!ranges.length) return { ok: false, tz };

  for (const [start, end] of ranges) {
    const s = parseHHMM(start);
    const e = parseHHMM(end);
    if (s == null || e == null) continue;
    if (minutes >= s && minutes < e) return { ok: true, tz };
  }
  return { ok: false, tz };
}

function requireAppBaseUrl() {
  const base = (process.env.APP_BASE_URL || "").trim();
  // You already set this to https://app.tikozap.com in Vercel
  return base || "https://app.tikozap.com";
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";

  // IMPORTANT: don’t leave placeholder in Twilio config
  if (!tenantId || tenantId === "YOUR_TENANT_ID") {
    const vr = new VoiceResponse();
    vr.say("TikoZap voice webhook is configured, but tenantId is missing.");
    return xml(vr.toString());
  }

  // Twilio params + signature validation
  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  const from = params.From || null;
  const callSid = params.CallSid || `manual_${Date.now()}`;
  const to = params.To || null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, storeName: true, timeZone: true },
  });

  const vr = new VoiceResponse();

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

  // Upsert CallSession to avoid duplicates on Twilio retries
  const session = await prisma.callSession.upsert({
    where: { providerCallSid: callSid },
    create: {
      tenantId,
      provider: "TWILIO",
      providerCallSid: callSid,
      fromNumber: from,
      toNumber: to,
      conversationId: conversation.id,
      status: "IN_PROGRESS",
    },
    update: {
      // keep it light — just ensure linkage is correct
      tenantId,
      fromNumber: from,
      toNumber: to,
      conversationId: conversation.id,
      status: "IN_PROGRESS",
    },
  });

  const enabled = settings?.enabled ?? false;

  // Kill switch: agent disabled => voicemail
  if (!enabled) {
    vr.say(settings?.fallbackLine || "Sorry, please leave a message after the tone.");
    await createAnswerMachineItem({
      tenantId,
      conversationId: conversation.id,
      callSessionId: session.id,
      type: "VOICEMAIL",
      fromNumber: from,
      reason: "disabled",
    });

    vr.record({
      action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${session.id}&reason=disabled`,
      method: "POST",
      maxLength: 180,
      playBeep: true,
      finishOnKey: "#",
    });
    return xml(vr.toString());
  }

  // After-hours gate (voicemail-only)
  const within = isWithinBusinessHours({
    businessHoursJson: settings?.businessHoursJson || null,
    timeZone: settings?.timeZone || tenant.timeZone || null,
    tzFallback: tenant.timeZone || "America/New_York",
  });

  const afterHoursVoicemailOnly = settings?.afterHoursVoicemailOnly ?? true;
  if (afterHoursVoicemailOnly && !within.ok) {
    await addMessage({
      conversationId: conversation.id,
      role: "system",
      content: `After-hours gate triggered (${within.tz}) → voicemail.`,
    });

console.log("[voice/incoming] tenantId=", tenantId);
console.log("[voice/incoming] settings=", {
  enabled: settings?.enabled,
  afterHoursVoicemailOnly: settings?.afterHoursVoicemailOnly,
  timeZone: settings?.timeZone,
  businessHoursJson: settings?.businessHoursJson,
});


    await prisma.callSession.update({
      where: { id: session.id },
      data: { fallbackTriggeredAt: new Date() },
    });

    await createAnswerMachineItem({
      tenantId,
      conversationId: conversation.id,
      callSessionId: session.id,
      type: "VOICEMAIL",
      fromNumber: from,
      reason: "after_hours",
    });

    vr.say(settings?.afterHoursLine || settings?.fallbackLine || "We're currently closed. Please leave a message after the tone.");
    vr.record({
      action: `${requireAppBaseUrl()}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${session.id}&reason=after_hours`,
      method: "POST",
      maxLength: 180,
      playBeep: true,
      finishOnKey: "#",
    });
    return xml(vr.toString());
  }

  // Normal conversational entry
  const greeting =
    settings?.greeting ||
    `Thanks for calling ${tenant.storeName}. How can I help today? Press 0 to leave a message, or press 1 to request a callback.`;

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

// Optional: allow browser GET for quick sanity checks (no Twilio validation).
// Leave it enabled for dev only.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";

  const vr = new VoiceResponse();
  if (!tenantId) {
    vr.say("Missing tenantId.");
    return xml(vr.toString());
  }
  vr.say("Voice endpoint is reachable. Twilio will POST to this endpoint.");
  vr.hangup();
  return xml(vr.toString());
}
