// src/app/api/billing/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { BillingStatus, PlanTier } from "@prisma/client";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// IMPORTANT: Stripe needs raw body string for signature verification.
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: `Webhook signature failed: ${err?.message ?? "?"}` }, { status: 400 });
  }

  // ✅ Idempotency: store event id once
  try {
    await prisma.billingWebhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        type: event.type,
        payload: event as any, // Prisma Json
      },
    });
  } catch (e: any) {
    // If unique constraint violation, ignore (replay)
    // Prisma error code for unique violation is P2002
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: true, replay: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to record webhook event" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(stripe, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscriptionUpdate(sub);
        break;
      }

      case "invoice.payment_failed":
      case "invoice.payment_succeeded": {
        // Optional: can infer status changes or log only
        // Keep minimal for Milestone 8
        break;
      }

      default:
        // no-op
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Stripe recommends returning 2xx unless you want retries.
    // Here we return 500 to trigger retry, because DB updates may have failed.
    return NextResponse.json({ ok: false, error: err?.message ?? "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  // For most setups, subscription events will also come through.
  // Still, it’s helpful to attach subscription id to BillingAccount quickly.
  const tenantId = session.metadata?.tenantId;
  if (!tenantId) return;

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!stripeCustomerId) return;

  await prisma.billingAccount.upsert({
    where: { tenantId },
    create: {
      tenantId,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId ?? undefined,
    },
  });

  // If subscription is present, pull it and apply full update now.
  if (stripeSubscriptionId) {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    await applySubscriptionUpdate(sub);
  }
}

async function applySubscriptionUpdate(sub: Stripe.Subscription) {
  const tenantId = sub.metadata?.tenantId;
  if (!tenantId) {
    // If you rely on customer metadata instead, you can fetch customer and map.
    return;
  }

  const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const priceId = sub.items.data[0]?.price?.id ?? null;

  const mappedStatus = mapStripeStatusToBillingStatus(sub.status);
  const mappedPlan = mapPriceIdToPlanTier(priceId);

  const currentPeriodEndUnix =
  (sub as any).current_period_end ?? (sub as any).currentPeriodEnd ?? null;

  const trialEndUnix =
  (sub as any).trial_end ?? (sub as any).trialEnd ?? null;

  const currentPeriodEnd =
  typeof currentPeriodEndUnix === "number" ? new Date(currentPeriodEndUnix * 1000) : null;

  const trialEndsAt =
  typeof trialEndUnix === "number" ? new Date(trialEndUnix * 1000) : null;

  // Update BillingAccount + Tenant in one transaction
  await prisma.$transaction(async (tx) => {
    if (stripeCustomerId) {
      await tx.billingAccount.upsert({
        where: { tenantId },
        create: {
          tenantId,
          stripeCustomerId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          status: mappedStatus,
          currentPeriodEnd,
          cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        },
        update: {
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId ?? undefined,
          status: mappedStatus,
          currentPeriodEnd: currentPeriodEnd ?? undefined,
          cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        },
      });
    }

    // Keep Tenant as your “fast” source of truth for UI + enforcement
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        billingStatus: mappedStatus,
        plan: mappedPlan ?? undefined,
        trialEndsAt: trialEndsAt ?? undefined,
      },
    });
  });
}

function mapStripeStatusToBillingStatus(status: Stripe.Subscription.Status): BillingStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    case "incomplete":
    default:
      return "NONE";
  }
}

function mapPriceIdToPlanTier(priceId: string | null): PlanTier | null {
  if (!priceId) return null;

  const starter = process.env.STRIPE_PRICE_STARTER;
  const pro = process.env.STRIPE_PRICE_PRO;
  const business = process.env.STRIPE_PRICE_BUSINESS;

  if (starter && priceId === starter) return "STARTER";
  if (pro && priceId === pro) return "PRO";
  if (business && priceId === business) return "BUSINESS";

  // Unknown price id (maybe old price) — don’t overwrite plan.
  return null;
}
