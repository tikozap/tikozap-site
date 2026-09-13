// src/app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { getTenantBillingUsage } from "@/lib/billingUsage";
import { getTenantVoiceUsage } from "@/lib/voiceUsage";
import { getTenantEntitlement } from "@/lib/tenantEntitlement";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

const [usage, voiceUsage, entitlement] = await Promise.all([
  getTenantBillingUsage(auth.tenant.id),
  getTenantVoiceUsage(auth.tenant.id),
  getTenantEntitlement(auth.tenant.id),
]);

return NextResponse.json({
  ok: true,
  usage: {
    ...usage,
    billingStatus: auth.tenant.billingStatus || null,
    entitlementState: entitlement.state,
    trialEndsAt: entitlement.trialEndsAt,
    voice: voiceUsage,
  },
});
}
