// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;

  const [salt, originalHash] = stored.split(':');
  if (!salt || !originalHash) return false;

  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(originalHash, 'hex')
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      ownedTenants: true,
      memberships: {
        include: { tenant: true },
      },
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid email or password.' },
      { status: 401 }
    );
  }

if (!user.emailVerifiedAt) {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Please verify your email before logging in.',
      verificationRequired: true,
    },
    { status: 403 }
  );
}
  
  const tenant = user.ownedTenants[0] || user.memberships[0]?.tenant;

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: 'No store found for this account.' },
      { status: 404 }
    );
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token: sessionToken,
      userId: user.id,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  const commonCookie = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  };

  cookieStore.set('tz_session', sessionToken, commonCookie);
  cookieStore.set('tz_tenant', tenant.id, commonCookie);
  cookieStore.set('tz_user_email', user.email, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
  cookieStore.set('tz_user_name', user.name || '', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
  cookieStore.set('tz_store_name', tenant.storeName, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });

return NextResponse.json({
  ok: true,
  redirectTo: tenant.onboardingCompletedAt
    ? '/dashboard/conversations'
    : '/onboarding/store',
});
}