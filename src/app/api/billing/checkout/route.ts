// src/app/api/billing/checkout/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenants";
import { getAppUrlFromRequest, getPriceIdForPlan, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const Body = z.object({
  tenantId: z.string().min(8),
  plan: z.nativeEnum(PlanTier),
  // optional overrides (useful if you have multiple frontends)
  successPath: z.string().optional(),
  cancelPath: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const json = await req.json();
    const body = Body.parse(json);

    await requireTenantAccess(userId, body.tenantId);

    const tenant = await prisma.tenant.findUnique({
      where: { id: body.tenantId },
      select: { id: true, slug: true, storeName: true },
    });
    if (!tenant) return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });

    const stripe = getStripe();
    const appUrl = getAppUrlFromRequest(req);

    // Ensure BillingAccount exists (customer id)
    const billing = await prisma.billingAccount.findUnique({
      where: { tenantId: tenant.id },
      select: { stripeCustomerId: true, billingEmail: true },
    });

    let stripeCustomerId = billing?.stripeCustomerId;

    if (!stripeCustomerId) {
      // You can choose what email to use; simplest is current user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name: user?.name ?? tenant.storeName,
        metadata: { tenantId: tenant.id },
      });

      stripeCustomerId = customer.id;

      await prisma.billingAccount.create({
        data: {
          tenantId: tenant.id,
          stripeCustomerId,
          billingEmail: user?.email ?? null,
        },
      });
    }

    const priceId = getPriceIdForPlan(body.plan);

    const successUrl = `${appUrl}${body.successPath ?? "/settings/billing?success=1"}`;
    const cancelUrl = `${appUrl}${body.cancelPath ?? "/settings/billing?canceled=1"}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // IMPORTANT: store tenantId for webhook reconciliation
      metadata: { tenantId: tenant.id, plan: body.plan },
      subscription_data: {
        metadata: { tenantId: tenant.id, plan: body.plan },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Unknown error";
    const status =
      msg === "UNAUTHENTICATED" ? 401 :
      msg === "FORBIDDEN" ? 403 :
      400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
