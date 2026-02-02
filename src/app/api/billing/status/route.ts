// src/app/api/billing/status/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenants";
import { getEntitlements, isBillingActiveOrTrialing } from "@/lib/entitlements";

export const runtime = "nodejs";

const Query = z.object({
  tenantId: z.string().min(8),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(req.url);
    const parsed = Query.parse({ tenantId: searchParams.get("tenantId") ?? "" });

    await requireTenantAccess(userId, parsed.tenantId);

    const tenant = await prisma.tenant.findUnique({
      where: { id: parsed.tenantId },
      select: {
        id: true,
        plan: true,
        billingStatus: true,
        trialEndsAt: true,
        timeZone: true,
        billingAccount: {
          select: {
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    if (!tenant) return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });

    const entitlements = getEntitlements(tenant.plan);

    return NextResponse.json({
      ok: true,
      tenant: {
        id: tenant.id,
        plan: tenant.plan,
        billingStatus: tenant.billingStatus,
        trialEndsAt: tenant.trialEndsAt,
        isActiveOrTrialing: isBillingActiveOrTrialing(tenant.billingStatus),
        entitlements,
      },
      billing: tenant.billingAccount ?? null,
    });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Unknown error";
    const status =
      msg === "UNAUTHENTICATED" ? 401 :
      msg === "FORBIDDEN" ? 403 :
      400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
