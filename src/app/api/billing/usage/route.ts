// src/app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { getTenantBillingUsage } from "@/lib/billingUsage";
import { getTenantVoiceUsage } from "@/lib/voiceUsage";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const usage = await getTenantBillingUsage(auth.tenant.id);
  const voiceUsage = await getTenantVoiceUsage(auth.tenant.id);

  return NextResponse.json({
    ok: true,
    usage: {
  ...usage,
  billingStatus: auth.tenant.billingStatus || "trialing",

  voice: voiceUsage,
    },
  });
}