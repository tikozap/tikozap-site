// src/app/api/starter-link/ensure/route.ts
import { NextResponse } from 'next/server';
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
    const exists = await prisma.starterLink.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

export async function GET() {
  return NextResponse.json(
    { ok: true, route: '/api/starter-link/ensure', now: new Date().toISOString() },
    { headers: { 'cache-control': 'no-store' } }
  );
}

export async function POST() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401, headers: { 'cache-control': 'no-store' } }
    );
  }

  const tenantId = auth.tenant.id;

  // getAuthedUserAndTenant() can return different shapes; normalize safely
  const t: any = auth.tenant as any;
  const tenantSlug = String(t.slug || '').trim();
  const tenantName = String(t.storeName || t.name || 'store').trim();

  const base = safeSlug(tenantSlug || tenantName || 'store');

  // Read existing once (avoid repeated queries)
  const existing = await prisma.starterLink.findFirst({
    where: { tenantId },
    select: { slug: true, title: true, tagline: true, greeting: true, buttonsJson: true },
  });

  const slug = existing?.slug || (await uniqueSlug(base));

  const link = await prisma.starterLink.upsert({
    where: { tenantId }, // requires tenantId to be unique in schema
    update: {
      slug,
      published: true,
      title: existing?.title || tenantName,
      tagline: existing?.tagline || 'Chat with us anytime.',
      greeting: existing?.greeting || 'Hi! How can we help today?',
      buttonsJson: existing?.buttonsJson || '[]',
    },
    create: {
      tenantId,
      slug,
      published: true,
      title: tenantName,
      tagline: 'Chat with us anytime.',
      greeting: 'Hi! How can we help today?',
      buttonsJson: '[]',
    },
  });

  const url = `https://link.tikozap.com/l/${encodeURIComponent(link.slug)}`;

  return NextResponse.json(
    { ok: true, link, url },
    { headers: { 'cache-control': 'no-store' } }
  );
}
