// src/app/api/onboarding/complete/route.ts

import { NextResponse } from 'next/server';

import { getAuthedUserAndTenant } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      { status: 401 },
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

  await prisma.tenant.update({
    where: {
      id: auth.tenant.id,
    },
    data: {
      onboardingCompletedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
  });
}