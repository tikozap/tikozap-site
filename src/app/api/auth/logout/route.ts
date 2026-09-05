// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('tz_session')?.value || '';

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { token: sessionToken },
    });
  }

  const res = NextResponse.json({ ok: true });

  const clearCookie = {
    path: '/',
    maxAge: 0,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookies.set('tz_session', '', {
    ...clearCookie,
    httpOnly: true,
  });

  res.cookies.set('tz_tenant', '', {
    ...clearCookie,
    httpOnly: true,
  });

  res.cookies.set('tz_user_email', '', clearCookie);
  res.cookies.set('tz_user_name', '', clearCookie);
  res.cookies.set('tz_store_name', '', clearCookie);

  return res;
}