// src/app/api/stripe/portal/route.ts

import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = 'nodejs';

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
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!tenant?.stripeCustomerId) {
    return NextResponse.json(
      { ok: false, error: 'No Stripe customer found yet.' },
      { status: 400 }
    );
  }

  const origin =
    process.env.APP_BASE_URL ||
    new URL(req.url).origin;

  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({
    ok: true,
    url: session.url,
  });
}