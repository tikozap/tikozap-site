import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';

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
    const rate = checkRateLimit(req, {
      namespace: 'demo-bootstrap',
      limit: 20,
      windowMs: 60_000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { ok: false, error: 'Too many bootstrap attempts. Please try again shortly.' },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const body: any = await req.json().catch(() => ({}));

    const tenantName = (body?.tenantName || 'Three Tree Fashion').toString().trim();
    const tenantSlug =
      (body?.tenantSlug || slugify(tenantName) || 'three-tree-fashion')
        .toString()
        .trim();

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
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      update: {
        storeName: tenantName,
        starterLinkSlug: tenantSlug,
        starterLinkEnabled: true,
      },
      create: {
        slug: tenantSlug,
        storeName: tenantName,
        starterLinkSlug: tenantSlug,
        starterLinkEnabled: true,
        owner: {
          connect: { id: owner.id },
        },
      },
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
