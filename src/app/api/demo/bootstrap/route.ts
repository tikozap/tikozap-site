// src/app/api/demo/bootstrap/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function slugify(input: string) {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));

    const tenantName = (body?.tenantName || 'Demo Boutique').toString().trim();
const rawSlug = (body?.tenantSlug || "").toString().trim();
const tenantSlug = slugify(rawSlug) || slugify(tenantName) || "demo-boutique";

if (!tenantSlug) {
  return NextResponse.json({ ok: false, error: "Missing tenantSlug" }, { status: 400 });
}

    const ownerEmail = `owner@${tenantSlug}.demo`;
    const ownerName = 'Demo Owner';

    // 1️⃣ Ensure owner exists
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        name: ownerName,
      },
    });

    // 2️⃣ Ensure tenant exists and is linked to owner
const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

const tenant = await prisma.tenant.upsert({
  where: { slug: tenantSlug },
  update: {
    storeName: tenantName,
    ownerId: owner.id,
    plan: "PRO",
    billingStatus: "TRIALING",
    trialEndsAt,
  },
  create: {
    slug: tenantSlug,
    storeName: tenantName,
    ownerId: owner.id,
    plan: "PRO",
    billingStatus: "TRIALING",
    trialEndsAt,
  },
});

await prisma.widget.upsert({
  where: { tenantId: tenant.id },
  update: { enabled: true },
  create: { tenantId: tenant.id, enabled: true },
});

    return NextResponse.json({
      ok: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        storeName: tenant.storeName,
      },
    });
  } catch (err: any) {
    console.error('[demo/bootstrap] error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'bootstrap failed' },
      { status: 500 }
    );
  }
}
