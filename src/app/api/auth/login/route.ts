import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';

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
    return NextResponse.json(
      { ok: false, error: 'Invalid email or password' },
      { status: 401 },
    );
  }

  // Pick a tenant for this session (first membership = default)
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!membership?.tenant) {
    return NextResponse.json(
      { ok: false, error: 'No tenant membership found for this user' },
      { status: 403 },
    );
  }

  // Sets tz_session cookie
  const { expiresAt } = await createSession(user.id);

  // ✅ Also set tz_tenant cookie (so getAuthedUserAndTenant can lock onto tenant fast)
  cookies().set('tz_tenant', membership.tenantId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

// clear demo cookies so real auth isn't shadowed
cookies().set('tz_demo_logged_in', '', { path: '/', maxAge: 0 });
cookies().set('tz_demo_tenant_slug', '', { path: '/', maxAge: 0 });
cookies().set('tz_demo_tenant_name', '', { path: '/', maxAge: 0 });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    tenant: {
      id: membership.tenant.id,
      slug: membership.tenant.slug,
      storeName: membership.tenant.storeName,
    },
  });
}
