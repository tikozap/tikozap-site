// src/app/api/stripe/webhook/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function planFromPrice(priceId: string | null | undefined) {
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business';

  if (priceId === process.env.STRIPE_PRICE_STARTER_YEARLY) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS_YEARLY) return 'business';

  return null;
}

function intervalFromSubscription(subscription: Stripe.Subscription) {
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'yearly' : 'monthly';
}

function isVoicePrice(priceId: string | null | undefined) {
  return (
    priceId === process.env.STRIPE_PRICE_VOICE_STARTER ||
    priceId === process.env.STRIPE_PRICE_VOICE_PRO ||
    priceId === process.env.STRIPE_PRICE_VOICE_BUSINESS
  );
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const value =
    (subscription as any).current_period_end ||
    (subscription.items?.data?.[0] as any)?.current_period_end;

  return typeof value === 'number' ? new Date(value * 1000) : null;
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing Stripe webhook config.' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
} catch (err: any) {
  console.error(
    '[stripe-webhook] Signature verification failed:',
    err?.message || err
  );

  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid webhook signature.',
    },
    { status: 400 }
  );
}

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const tenantId = session.metadata?.tenantId;
      const kind = session.metadata?.kind;

      if (tenantId && kind === 'voice') {
        const voicePack = session.metadata?.voicePack || null;
        const voiceMinutesLimit = Number(
          session.metadata?.voiceMinutesLimit || 0
        );

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            voiceEnabled: true,
            voicePack,
            voiceMinutesLimit,
            voiceMinutesUsed: 0,
            voiceUsagePeriodStart: new Date(),

            stripeVoiceCustomerId:
              typeof session.customer === 'string'
                ? session.customer
                : undefined,

            stripeVoiceSubscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : undefined,

            voiceBillingStatus: 'active',
            voiceCancelAtPeriodEnd: false,
            voiceCurrentPeriodEnd: null,
          },
        });
      } else {
        const plan = session.metadata?.plan;

        if (tenantId && plan) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              billingPlan: plan,
              billingInterval:
                session.metadata?.billingInterval === 'yearly'
                  ? 'yearly'
                  : 'monthly',
              billingStatus: 'active',

              stripeCustomerId:
                typeof session.customer === 'string'
                  ? session.customer
                  : undefined,

              stripeSubscriptionId:
                typeof session.subscription === 'string'
                  ? session.subscription
                  : undefined,
            },
          });
        }
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.created'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = planFromPrice(priceId);

      if (plan) {
        await prisma.tenant.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            billingPlan: plan,
            billingInterval: intervalFromSubscription(subscription),
            billingStatus: subscription.status,
            stripeCancelAtPeriodEnd: Boolean(
              subscription.cancel_at_period_end
            ),
            stripeCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
          },
        });
      }

      if (isVoicePrice(priceId)) {
        await prisma.tenant.updateMany({
          where: { stripeVoiceSubscriptionId: subscription.id },
          data: {
            voiceBillingStatus: subscription.status,
            voiceCancelAtPeriodEnd: Boolean(
              subscription.cancel_at_period_end
            ),
            voiceCurrentPeriodEnd: subscriptionPeriodEnd(subscription),
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.tenant.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          billingStatus: 'canceled',
          stripeCancelAtPeriodEnd: false,
          stripeCurrentPeriodEnd: null,
        },
      });

      await prisma.tenant.updateMany({
        where: { stripeVoiceSubscriptionId: subscription.id },
        data: {
          voiceBillingStatus: 'canceled',
          voiceEnabled: false,
          voiceCancelAtPeriodEnd: false,
          voiceCurrentPeriodEnd: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
} catch (err: any) {
  console.error(
    '[stripe-webhook] Handler failed:',
    err?.message || err
  );

  return NextResponse.json(
    {
      ok: false,
      error: 'Webhook handler failed.',
    },
    { status: 500 }
  );
}
}