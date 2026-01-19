import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

const COMMIT =
  (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '')
    .slice(0, 7) || 'local';

// GET -> check current session (DemoMerchantStart useEffect)
export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const tenantName =
    ('storeName' in auth.tenant && auth.tenant.storeName) ||
    ('name' in auth.tenant && auth.tenant.name) ||
    auth.tenant.slug ||
    'Your store';

  const widget = await prisma.widget.findUnique({
    where: { tenantId: auth.tenant.id },
    select: {
      publicKey: true,
      enabled: true,
      assistantName: true,
      greeting: true,
      brandColor: true,
      installedAt: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      commit: COMMIT,
      tenant: {
        id: auth.tenant.id,
        slug: auth.tenant.slug,
        name: tenantName,
        storeName: tenantName,
      },
      widget,
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}

// POST -> create/reuse demo user + tenant, make session, set cookies, ensure widget exists
export async function POST() {
  const demoEmail = 'demo-merchant@tikozap.test';

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, name: 'Demo Merchant' },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'three-tree-fashion' },
    update: {},
    create: {
      slug: 'three-tree-fashion',
      storeName: 'Three Tree Fashion',
      owner: { connect: { id: user.id } },
    },
  });

  // Keep membership (owner)
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
    },
  });

  // Ensure widget exists + enabled (publicKey stays stable once created)
  const widget = await prisma.widget.upsert({
    where: { tenantId: tenant.id },
    update: {
      enabled: true,
      assistantName: 'Three Tree Assistant',
      greeting: 'Hi! How can I help today?',
      brandColor: '#111827',
    },
    create: {
      tenantId: tenant.id,
      enabled: true,
      assistantName: 'Three Tree Assistant',
      greeting: 'Hi! How can I help today?',
      brandColor: '#111827',
    },
    select: {
      publicKey: true,
      enabled: true,
      assistantName: true,
      greeting: true,
      brandColor: true,
      installedAt: true,
    },
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  const jar = cookies();
  jar.set('tz_session', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });
  jar.set('tz_tenant', tenant.id, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  });

  return NextResponse.json(
    {
      ok: true,
      commit: COMMIT,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.storeName,
        storeName: tenant.storeName,
      },
      widget,
      widgetPublicKey: widget.publicKey,
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
