// src/app/api/onboarding/complete/route.ts

import { NextResponse } from 'next/server';

import { getAuthedUserAndTenant } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
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