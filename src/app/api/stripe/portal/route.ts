// src/app/api/stripe/portal/route.ts

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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

  const origin = process.env.APP_BASE_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({
    ok: true,
    url: session.url,
  });
}