// src/app/api/starter-link/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeSlug(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base: string) {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.starterLink.findFirst({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

const ButtonSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url().max(500),
});

const BodySchema = z.object({
  published: z.boolean().optional(),

  // NOTE: allow null so user can clear fields
  title: z.string().max(120).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  greeting: z.string().max(400).optional().nullable(),

  logoUrl: z.string().url().max(500).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),

  buttons: z.array(ButtonSchema).max(6).optional(),

  // later editor can use this; keep as string for now
  hoursJson: z.string().max(4000).optional().nullable(),
});

function tenantNameFrom(t: any) {
  return t?.storeName ?? t?.name ?? 'Your store';
}

function tenantSlugBaseFrom(t: any) {
  return t?.slug ? String(t.slug) : safeSlug(tenantNameFrom(t));
}

function parseButtonsJson(buttonsJson: string | null | undefined) {
  try {
    const arr = JSON.parse(buttonsJson || '[]');
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.label === 'string' && typeof x.url === 'string')
      .map((x) => ({ label: String(x.label).slice(0, 40), url: String(x.url).slice(0, 500) }))
      .slice(0, 6);
  } catch {
    return [];
  }
}

function toChannel(link: any) {
  return {
    id: link.id,
    slug: link.slug,
    published: Boolean(link.published),
    title: link.title,
    tagline: link.tagline,
    greeting: link.greeting,
    logoUrl: link.logoUrl,
    phone: link.phone,
    address: link.address,
    city: link.city,
    hoursJson: link.hoursJson,
    buttons: parseButtonsJson(link.buttonsJson),
  };
}

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: { 'cache-control': 'no-store' } }
    );
  }

  const tenantId = auth.tenant.id;

  // ✅ Ensure widget exists so the link page can always embed the bubble
  const widget = await prisma.widget.upsert({
    where: { tenantId },
    update: {},
    create: { tenantId },
    select: { publicKey: true },
  });

  let link = await prisma.starterLink.findFirst({ where: { tenantId } });

  if (!link) {
    const base = safeSlug(tenantSlugBaseFrom(auth.tenant));
    const slug = await uniqueSlug(base);

    link = await prisma.starterLink.create({
      data: {
        tenantId,
        slug,
        published: false,
        title: tenantNameFrom(auth.tenant),
        tagline: 'Chat with us anytime.',
        greeting: 'Hi! How can we help today?',
        buttonsJson: '[]',
      },
    });
  }

  const url = `https://link.tikozap.com/l/${encodeURIComponent(link.slug)}`;

  // ✅ Return BOTH keys to be backward-compatible with any older UI
  return NextResponse.json(
    { ok: true, channel: toChannel(link), link, url, widgetPublicKey: widget.publicKey },
    { headers: { 'cache-control': 'no-store' } }
  );
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: { 'cache-control': 'no-store' } }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400, headers: { 'cache-control': 'no-store' } }
    );
  }

  const tenantId = auth.tenant.id;
  const data = parsed.data;

  // ✅ Ensure widget exists
  const widget = await prisma.widget.upsert({
    where: { tenantId },
    update: {},
    create: { tenantId },
    select: { publicKey: true },
  });

  const existing = await prisma.starterLink.findFirst({ where: { tenantId }, select: { slug: true } });

  const base = safeSlug(tenantSlugBaseFrom(auth.tenant));
  const slug = existing?.slug ?? (await uniqueSlug(base));

  const buttonsJson = data.buttons === undefined ? undefined : JSON.stringify(data.buttons);

  // IMPORTANT: use explicit undefined checks so null can clear values
  const link = await prisma.starterLink.upsert({
    where: { tenantId },
    update: {
      slug,

      published: data.published === undefined ? undefined : data.published,

      title: data.title === undefined ? undefined : data.title,
      tagline: data.tagline === undefined ? undefined : data.tagline,
      greeting: data.greeting === undefined ? undefined : data.greeting,

      logoUrl: data.logoUrl === undefined ? undefined : data.logoUrl,
      phone: data.phone === undefined ? undefined : data.phone,
      address: data.address === undefined ? undefined : data.address,
      city: data.city === undefined ? undefined : data.city,

      hoursJson: data.hoursJson === undefined ? undefined : data.hoursJson,

      buttonsJson: buttonsJson === undefined ? undefined : buttonsJson,
    },
    create: {
      tenantId,
      slug,

      published: data.published ?? false,

      title: data.title ?? tenantNameFrom(auth.tenant),
      tagline: data.tagline ?? 'Chat with us anytime.',
      greeting: data.greeting ?? 'Hi! How can we help today?',

      logoUrl: data.logoUrl ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,

      hoursJson: data.hoursJson ?? null,

      buttonsJson: buttonsJson ?? '[]',
    },
  });

  const url = `https://link.tikozap.com/l/${encodeURIComponent(link.slug)}`;

  return NextResponse.json(
    { ok: true, channel: toChannel(link), link, url, widgetPublicKey: widget.publicKey },
    { headers: { 'cache-control': 'no-store' } }
  );
}
