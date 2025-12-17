import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const nameRaw = typeof body.name === 'string' ? body.name : '';
  const storeRaw = typeof body.storeName === 'string' ? body.storeName : 'Three Tree Fashion';

  const email = emailRaw.trim().toLowerCase();
  const name = nameRaw.trim() || null;
  const storeName = storeRaw.trim() || 'Three Tree Fashion';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'Valid email required.' }, { status: 400 });
  }

  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({ data: { email, name } }));

  let membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
  });

  let tenant = membership?.tenant ?? null;

  if (!tenant) {
    const base = slugify(storeName) || 'store';
    const slug = `${base}-${user.id.slice(0, 6)}`;

    tenant = await prisma.tenant.create({
      data: {
        slug,
        storeName,
        ownerId: user.id,
        memberships: { create: { userId: user.id, role: 'owner' } },
        widget: { create: {} },
      },
    });

    membership = await prisma.membership.findFirst({
      where: { userId: user.id, tenantId: tenant.id },
      include: { tenant: true },
    });
  } else {
    const widget = await prisma.widget.findUnique({ where: { tenantId: tenant.id } });
    if (!widget) await prisma.widget.create({ data: { tenantId: tenant.id } });
  }

  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  const res = NextResponse.json({
    ok: true,
    tenant: { id: tenant!.id, slug: tenant!.slug, storeName: tenant!.storeName },
  });

  res.cookies.set('tz_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  res.cookies.set('tz_tenant', tenant!.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
