// src/app/api/billing/portal/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenants";
import { getAppUrlFromRequest, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const Body = z.object({
  tenantId: z.string().min(8),
  returnPath: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const json = await req.json();
    const body = Body.parse(json);

    await requireTenantAccess(userId, body.tenantId);

    const billing = await prisma.billingAccount.findUnique({
      where: { tenantId: body.tenantId },
      select: { stripeCustomerId: true },
    });

    if (!billing?.stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: "No billing customer yet. Start checkout first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrlFromRequest(req);
    const returnUrl = `${appUrl}${body.returnPath ?? "/settings/billing"}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: returnUrl,
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
