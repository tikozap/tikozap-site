// src/app/api/voice/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAbsoluteUrl, readTwilioParams, validateTwilioWebhookOrThrow } from "@/lib/twilio/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || "";
  const callSessionId = url.searchParams.get("callSessionId") || "";
  if (!tenantId || !callSessionId) return new NextResponse("Missing tenantId/callSessionId", { status: 400 });

  const params = await readTwilioParams(req);
  const fullUrl = buildAbsoluteUrl(req);
  validateTwilioWebhookOrThrow({ req, params, fullUrl });

  // You can store these if you want richer analytics
  const callStatus = params.CallStatus || params.RecordingStatus || "";
  const ended = callStatus === "completed" || callStatus === "COMPLETED";

  await prisma.callSession.update({
    where: { id: callSessionId },
    data: {
      status: ended ? "COMPLETED" : undefined,
      endedAt: ended ? new Date() : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
