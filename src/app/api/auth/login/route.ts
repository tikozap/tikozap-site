// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/session';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  const ok = !!user?.passwordHash && verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!membership?.tenant) {
    return NextResponse.json({ ok: false, error: 'No tenant membership found for this user' }, { status: 403 });
  }

  // Ideally createSession returns a token + expiresAt (recommended).
  // If your createSession already sets tz_session internally, keep that and skip setting tz_session below.
  const session = await createSession(user.id); 
  const expiresAt = session.expiresAt;
  const sessionToken = (session as any).token; // adjust to your real return type

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    tenant: { id: membership.tenant.id, slug: membership.tenant.slug, storeName: membership.tenant.storeName },
  });

  const isProd = process.env.NODE_ENV === 'production';
  const baseCookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    expires: expiresAt,
  };

  // ✅ Set both cookies on the RESPONSE
  if (sessionToken) res.cookies.set('tz_session', sessionToken, baseCookie);
  res.cookies.set('tz_tenant', membership.tenantId, baseCookie);

  // clear demo cookies so real auth isn't shadowed
  res.cookies.set('tz_demo_logged_in', '', { path: '/', maxAge: 0 });
  res.cookies.set('tz_demo_tenant_slug', '', { path: '/', maxAge: 0 });
  res.cookies.set('tz_demo_tenant_name', '', { path: '/', maxAge: 0 });

  return res;
}
