// src/app/api/starter-link/route.ts

import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = 'nodejs';

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

function safeImageSource(value: unknown) {
  const raw = String(value || "").trim();

  if (!raw) return null;

  if (
    /^data:image\/(?:jpeg|png|webp);base64,/i.test(raw)
  ) {
    return raw;
  }

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

type StarterProduct = {
  title: string;
  price: string;
  image: string;
};

function sanitizeStarterProduct(value: unknown): StarterProduct | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const product = value as Record<string, unknown>;

  return {
    title: clean(product.title),
    price: clean(product.price),
    image: safeImageSource(product.image) || "",
  };
}

function sanitizeBestSellerJson(value: unknown) {
  const raw = clean(value);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const product = sanitizeStarterProduct(parsed);

    return product
      ? JSON.stringify(product)
      : null;
  } catch {
    return null;
  }
}

function sanitizeProductsJson(value: unknown) {
  const raw = clean(value);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const products = parsed
      .slice(0, 9)
      .map(sanitizeStarterProduct)
      .filter(
        (product): product is StarterProduct =>
          Boolean(product)
      );

    return JSON.stringify(products);
  } catch {
    return null;
  }
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

const realTenantId = auth.tenant.id;

const tenant = await prisma.tenant.findUnique({
  where: { id: realTenantId },
  select: {
    id: true,
    slug: true,
    storeName: true,
    starterLinkSlug: true,
    starterLinkEnabled: true,
    starterLinkPage: true,
    settingsJson: true,
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

  let settings: Record<string, unknown> = {};

try {
  settings = tenant.settingsJson
    ? JSON.parse(tenant.settingsJson)
    : {};
} catch {
  settings = {};
}

const canonicalAssistantName =
  typeof settings.tz_assistant_name === 'string'
    ? settings.tz_assistant_name.trim()
    : '';

const canonicalGreeting =
  typeof settings.tz_assistant_greeting === 'string'
    ? settings.tz_assistant_greeting.trim()
    : '';

    const canonicalBrandColor =
  typeof settings.tz_brand_color === 'string'
    ? settings.tz_brand_color.trim()
    : '';

    const canonicalContactEmail =
  typeof settings.supportEmail === 'string'
    ? settings.supportEmail.trim()
    : '';

  return NextResponse.json({
    ok: true,
    starterLink: {
      enabled: tenant.starterLinkEnabled,
      slug,
      url: slug ? linkFor(slug) : null,
      storeName: tenant.storeName,
assistant: {
  assistantName:
    canonicalAssistantName ||
    tenant.widget?.assistantName ||
    '',
  greeting:
    canonicalGreeting ||
    tenant.widget?.greeting ||
    '',
  brandColor:
  canonicalBrandColor ||
  tenant.widget?.brandColor ||
  '',
},
page: {
  ...(tenant.starterLinkPage || {}),
  contactEmail:
    canonicalContactEmail ||
    tenant.starterLinkPage?.contactEmail ||
    '',
},
    },
  });
}

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
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  if (auth.tenant.role !== 'owner') {
  return NextResponse.json(
    {
      ok: false,
      error: 'Owner access required.',
    },
    {
      status: 403,
    }
  );
}

  const body = await req.json().catch(() => ({}));

  if (body.action === 'set-enabled') {
const realTenantId = auth.tenant.id;

    const enabled = body.enabled === true;

    const tenant = await prisma.tenant.update({
      where: { id: realTenantId },
      data: {
        starterLinkEnabled: enabled,
      },
      select: {
        starterLinkEnabled: true,
        starterLinkSlug: true,
        slug: true,
      },
    });

    return NextResponse.json({
      ok: true,
      enabled: tenant.starterLinkEnabled,
      slug: tenant.starterLinkSlug || tenant.slug,
    });
  }

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

const realTenantId = auth.tenant.id;

const existingTenant = await prisma.tenant.findUnique({
  where: { id: realTenantId },
  select: {
    settingsJson: true,
  },
});

let currentSettings: Record<string, unknown> = {};

try {
  currentSettings = existingTenant?.settingsJson
    ? JSON.parse(existingTenant.settingsJson)
    : {};
} catch {
  currentSettings = {};
}

const nextSettings = {
  ...currentSettings,
  tz_assistant_name: clean(assistant.assistantName),
  tz_assistant_greeting: clean(assistant.greeting),
  supportEmail: clean(page.contactEmail),
};

const safeBestSellerJson =
  sanitizeBestSellerJson(page.bestSellerJson);

const safeProductsJson =
  sanitizeProductsJson(page.productsJson);

  try {
    const tenant = await prisma.tenant.update({
      where: { id: realTenantId },
      data: {
        starterLinkSlug: normalized,
        starterLinkEnabled: enabled,
storeName:
  clean(body.storeName) ||
  auth.tenant.storeName ||
  'Your Store',

settingsJson: JSON.stringify(nextSettings),

        starterLinkPage: {
          upsert: {
            create: {
              logoUrl: safeImageSource(page.logoUrl),
              tagline: clean(page.tagline) || null,
              subheading: clean(page.subheading) || null,
              footerLine: clean(page.footerLine) || null,
              contactEmail: clean(page.contactEmail) || null,
              shippingNote: clean(page.shippingNote) || null,
              returnNote: clean(page.returnNote) || null,
bestSellerJson: safeBestSellerJson,
productsJson: safeProductsJson,
              showProductsNav: bool(page.showProductsNav, true),
              showContactNav: bool(page.showContactNav, true),
              showFooterBrand: bool(page.showFooterBrand, true),
            },
            update: {
              logoUrl: safeImageSource(page.logoUrl),
              tagline: clean(page.tagline) || null,
              subheading: clean(page.subheading) || null,
              footerLine: clean(page.footerLine) || null,
              contactEmail: clean(page.contactEmail) || null,
              shippingNote: clean(page.shippingNote) || null,
              returnNote: clean(page.returnNote) || null,
bestSellerJson: safeBestSellerJson,
productsJson: safeProductsJson,
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
            },
            update: {
              assistantName: clean(assistant.assistantName) || null,
              greeting: clean(assistant.greeting) || null,
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

    console.error('[starter-link] Save failed:', err);

    return NextResponse.json(
      { ok: false, error: 'Could not save Starter Link settings.' },
      { status: 500 },
    );
  }
}