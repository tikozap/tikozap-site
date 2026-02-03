// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { hashPassword } from '@/lib/password';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().max(80).optional().nullable(),
  storeName: z.string().max(80).optional().nullable(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function makeUniqueSlug(baseRaw: string) {
  const base = slugify(baseRaw) || 'store';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;

    const t = await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (t) continue;

    const s = await prisma.starterLink.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (s) continue;

    return candidate;
  }
  return `${base}-${nanoid(6).toLowerCase()}`;
}

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());

    const email = body.email.trim().toLowerCase();
    const name = (body.name ?? '').toString().trim() || null;

    const exists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: 'Email already registered' },
        { status: 409 },
      );
    }

    // ✅ Use the shared hash function (matches src/lib/password.ts verify)
    const passwordHash = hashPassword(body.password);

    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    const storeName =
      (body.storeName ?? '').toString().trim() ||
      (name ? `${name}'s Store` : 'My Store');

    const slug = await makeUniqueSlug(storeName || email.split('@')[0]);

    const tenant = await prisma.tenant.create({
      data: {
        slug,
        storeName,
        ownerId: user.id,
        memberships: {
          create: { role: 'owner', userId: user.id },
        },
        widget: { create: {} },
        starterLink: {
          create: {
            slug,
            published: false,
            title: storeName,
            tagline: 'Chat with us anytime.',
            greeting: 'Hi! How can we help today?',
          },
        },
      },
      select: { id: true, slug: true, storeName: true },
    });

    // Session cookie (same as your current behavior)
    const token = nanoid(32);
    const maxAgeSec = 60 * 60 * 24 * 30; // 30 days
    const expiresAt = new Date(Date.now() + maxAgeSec * 1000);

    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });

    const res = NextResponse.json({ ok: true, user, tenant }, { status: 200 });

    const cookieBase = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: maxAgeSec,
    };

    res.cookies.set('tz_session', token, cookieBase);
    res.cookies.set('tz_tenant', tenant.id, cookieBase);

    return res;
  } catch (err: any) {
    console.error('[auth/signup] error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Signup failed' },
      { status: 500 },
    );
  }
}
