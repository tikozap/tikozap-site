// src/app/api/demo-login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

// GET -> check current session (DemoMerchantStart useEffect)
export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const tenantName = auth.tenant.storeName || auth.tenant.slug || 'Your store';

  return NextResponse.json({
    ok: true,
    tenant: {
      id: auth.tenant.id,
      slug: auth.tenant.slug,
      name: tenantName,       // demo UI expects "name"
      storeName: tenantName,  // dashboard/auth/me expects "storeName"
    },
  });
}

// POST -> create/reuse demo user + tenant, make session, set cookies
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

const widget = await prisma.widget.upsert({
  where: { tenantId: tenant.id },
  update: {
    enabled: true,
    publicKey: tenant.id,
    assistantName: "Three Tree Assistant",
    greeting: "Hi! How can I help today?",
    brandColor: "#111827",
  },
  create: {
    tenantId: tenant.id,
    publicKey: tenant.id,
    enabled: true,
    assistantName: "Three Tree Assistant",
    greeting: "Hi! How can I help today?",
    brandColor: "#111827",
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

return NextResponse.json({
  ok: true,
  tenant: {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.storeName,
    storeName: tenant.storeName,
  },
  widget: {
    publicKey: widget.publicKey,
    enabled: widget.enabled,
  },
});
}
