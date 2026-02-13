// src/app/api/voice/incoming/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
const VoiceResponse = twilio.twiml.VoiceResponse;
import { prisma } from "@/lib/prisma";
import { ensurePhoneConversation, addMessage } from "@/lib/answerMachine";

export const runtime = "nodejs";

function xml(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";

  // IMPORTANT: don’t leave placeholder in Twilio config
  if (!tenantId || tenantId === "YOUR_TENANT_ID") {
    const vr = new VoiceResponse();
    vr.say("TikoZap voice webhook is configured, but tenantId is missing.");
    return xml(vr.toString());
  }

  // Twilio sends POST form fields; if this is GET (browser), it will be empty.
  let params: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = String(v);
  } catch {
    // ignore
  }

  const from = params.From || null;
  const callSid = params.CallSid || `manual_${Date.now()}`;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, storeName: true },
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

  const session = await prisma.callSession.create({
    data: {
      tenantId,
      provider: "TWILIO",
      providerCallSid: callSid,
      fromNumber: from,
      toNumber: params.To || null,
      conversationId: conversation.id,
      status: "IN_PROGRESS",
    },
  });

  const enabled = settings?.enabled ?? false;

  if (!enabled) {
    vr.say(settings?.fallbackLine || "Sorry, please leave a message after the tone.");
    vr.record({
      action: `${process.env.APP_BASE_URL}/api/voice/voicemail?tenantId=${tenantId}&callSessionId=${session.id}&reason=disabled`,
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
    action: `${process.env.APP_BASE_URL}/api/voice/turn?tenantId=${tenantId}&callSessionId=${session.id}&turn=0`,
    method: "POST",
    timeout: 6,
    speechTimeout: "auto",
  });

  return xml(vr.toString());
}

export async function POST(req: Request) {
  return handle(req);
}

// TEMP: helpful for browser testing; remove later if you want
export async function GET(req: Request) {
  return handle(req);
}
