// src/app/api/stripe/voice-checkout/route.ts

import { NextResponse } from "next/server";
import { getStripe } from '@/lib/stripe';
import { getAuthedUserAndTenant } from "@/lib/auth";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = "nodejs";

const VOICE_PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_VOICE_STARTER,
  pro: process.env.STRIPE_PRICE_VOICE_PRO,
  business: process.env.STRIPE_PRICE_VOICE_BUSINESS,
};

const VOICE_LIMIT_MAP: Record<string, number> = {
  starter: 100,
  pro: 350,
  business: 1100,
};

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}
  try {
    const auth = await getAuthedUserAndTenant();

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (auth.tenant.role !== 'owner') {
  return NextResponse.json(
    {
      ok: false,
      error: 'Owner access required.',
    },
    {
      status: 403,
    }
  );
}

    const body = await req.json().catch(() => ({}));
    const pack = String(body.pack || "").toLowerCase();

    const priceId = VOICE_PRICE_MAP[pack];
    const minutes = VOICE_LIMIT_MAP[pack];

    if (!priceId || !minutes) {
      return NextResponse.json(
        { ok: false, error: "Invalid voice pack." },
        { status: 400 }
      );
    }

    const origin = process.env.APP_BASE_URL || new URL(req.url).origin;

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: auth.user.email || undefined,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        tenantId: auth.tenant.id,
        kind: "voice",
        voicePack: pack,
        voiceMinutesLimit: String(minutes),
      },

      success_url: `${origin}/dashboard/billing?success=1&voice=1`,
      cancel_url: `${origin}/dashboard/billing?canceled=1&voice=1`,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error: any) {
console.error(
  '[stripe-voice-checkout] Failed:',
  error?.message || error
);

return NextResponse.json(
  {
    ok: false,
    error: "Voice checkout failed.",
  },
  { status: 500 }
);
  }
}