// src/app/api/starter-link/route.ts

import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function findRealTenantId(auth: Awaited<ReturnType<typeof getAuthedUserAndTenant>>) {
  if (!auth) return null;

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: auth.tenant.id },
        { slug: auth.tenant.slug || undefined },
        { storeName: auth.tenant.storeName || undefined },
      ],
    },
    select: { id: true },
  });

  return tenant?.id || null;
}

function toSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,64}$/.test(slug);
}

function linkFor(slug: string): string {
  return `/l/${slug}`;
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const realTenantId = await findRealTenantId(auth);

  if (!realTenantId) {
    return NextResponse.json(
      { ok: false, error: 'Tenant not found' },
      { status: 404 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: realTenantId },
    select: {
      id: true,
      slug: true,
      storeName: true,
      starterLinkSlug: true,
      starterLinkEnabled: true,
      starterLinkPage: true,
      widget: {
        select: {
          assistantName: true,
          greeting: true,
          brandColor: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });
  }

  const slug = tenant.starterLinkSlug || tenant.slug;

  return NextResponse.json({
    ok: true,
    starterLink: {
      enabled: tenant.starterLinkEnabled,
      slug,
      url: slug ? linkFor(slug) : null,
      storeName: tenant.storeName,
      assistant: {
        assistantName: tenant.widget?.assistantName || '',
        greeting: tenant.widget?.greeting || '',
        brandColor: tenant.widget?.brandColor || '',
      },
      page: tenant.starterLinkPage || null,
    },
  });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const slugRaw = typeof body.slug === 'string' ? body.slug : '';
  const enabled = body.enabled === false ? false : true;
  const normalized = toSlug(slugRaw) || auth.tenant.slug || '';

  if (!isValidSlug(normalized)) {
    return NextResponse.json(
      { ok: false, error: 'Starter Link slug must be 3-64 chars (a-z, 0-9, hyphen).' },
      { status: 400 },
    );
  }

  const page = body.page || {};
  const assistant = body.assistant || {};

const realTenantId = await findRealTenantId(auth);

if (!realTenantId) {
  return NextResponse.json(
    { ok: false, error: 'Tenant not found' },
    { status: 404 }
  );
}

  try {
    const tenant = await prisma.tenant.update({
      where: { id: realTenantId },
      data: {
        starterLinkSlug: normalized,
        starterLinkEnabled: enabled,
        storeName: clean(body.storeName) || auth.tenant.storeName || 'Demo Boutique',
        starterLinkPage: {
          upsert: {
            create: {
              logoUrl: clean(page.logoUrl) || null,
              tagline: clean(page.tagline) || null,
              subheading: clean(page.subheading) || null,
              footerLine: clean(page.footerLine) || null,
              contactEmail: clean(page.contactEmail) || null,
              shippingNote: clean(page.shippingNote) || null,
              returnNote: clean(page.returnNote) || null,
              bestSellerJson: clean(page.bestSellerJson) || null,
              productsJson: clean(page.productsJson) || null,
              showProductsNav: bool(page.showProductsNav, true),
              showContactNav: bool(page.showContactNav, true),
              showFooterBrand: bool(page.showFooterBrand, true),
            },
            update: {
              logoUrl: clean(page.logoUrl) || null,
              tagline: clean(page.tagline) || null,
              subheading: clean(page.subheading) || null,
              footerLine: clean(page.footerLine) || null,
              contactEmail: clean(page.contactEmail) || null,
              shippingNote: clean(page.shippingNote) || null,
              returnNote: clean(page.returnNote) || null,
              bestSellerJson: clean(page.bestSellerJson) || null,
              productsJson: clean(page.productsJson) || null,
              showProductsNav: bool(page.showProductsNav, true),
              showContactNav: bool(page.showContactNav, true),
              showFooterBrand: bool(page.showFooterBrand, true),
            },
          },
        },
        widget: {
          upsert: {
            create: {
              publicKey: `tz_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`,
              enabled: true,
              assistantName: clean(assistant.assistantName) || null,
              greeting: clean(assistant.greeting) || null,
              brandColor: clean(assistant.brandColor) || null,
            },
            update: {
              assistantName: clean(assistant.assistantName) || null,
              greeting: clean(assistant.greeting) || null,
              brandColor: clean(assistant.brandColor) || null,
            },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        storeName: true,
        starterLinkSlug: true,
        starterLinkEnabled: true,
        starterLinkPage: true,
        widget: {
          select: {
            assistantName: true,
            greeting: true,
            brandColor: true,
          },
        },
      },
    });

    const slug = tenant.starterLinkSlug || tenant.slug;

    return NextResponse.json({
      ok: true,
      starterLink: {
        enabled: tenant.starterLinkEnabled,
        slug,
        url: slug ? linkFor(slug) : null,
        storeName: tenant.storeName,
        assistant: {
          assistantName: tenant.widget?.assistantName || '',
          greeting: tenant.widget?.greeting || '',
          brandColor: tenant.widget?.brandColor || '',
        },
        page: tenant.starterLinkPage,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'That Starter Link slug is already in use.' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, error: err?.message || 'Could not save Starter Link settings.' },
      { status: 500 },
    );
  }
}