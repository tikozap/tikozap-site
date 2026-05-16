// src/app/api/stripe/checkout/route.ts

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

const PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,

  "starter-yearly": process.env.STRIPE_PRICE_STARTER_YEARLY,
  "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY,
  "business-yearly": process.env.STRIPE_PRICE_BUSINESS_YEARLY,
};

export async function POST(req: Request) {
  try {
    const auth = await getAuthedUserAndTenant();

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan || '').toLowerCase();
    const billingInterval = plan.endsWith('-yearly') ? 'yearly' : 'monthly';
    const basePlan = plan.replace('-yearly', '');

    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: 'Invalid plan.' },
        { status: 400 }
      );
    }

    const origin =
      process.env.APP_BASE_URL ||
      new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: auth.user.email || undefined,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

metadata: {
  tenantId: auth.tenant.id,
  plan: basePlan,
  billingInterval,
},

      success_url: `${origin}/dashboard/billing?success=1`,
      cancel_url: `${origin}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Checkout failed.',
      },
      { status: 500 }
    );
  }
}