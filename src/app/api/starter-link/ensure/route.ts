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
    const exists = await prisma.starterLink.findFirst({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(16).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

export async function GET() {
  // quick ping to confirm deployed
  return NextResponse.json(
    { ok: true, route: '/api/starter-link/ensure', now: new Date().toISOString() },
    { headers: { 'cache-control': 'no-store' } }
  );
}

export async function POST() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  }

  const tenantId = auth.tenant.id;

  // Prefer tenant slug if available; fallback to storeName
  const base = safeSlug((auth.tenant as any).slug || auth.tenant.storeName || 'store');
  const slug = await uniqueSlug(base);

  const link = await prisma.starterLink.upsert({
    where: { tenantId },
    update: {
      // keep existing slug if already set; otherwise set one
      slug: (await prisma.starterLink.findFirst({ where: { tenantId }, select: { slug: true } }))?.slug || slug,
      published: true,
      title: (await prisma.starterLink.findFirst({ where: { tenantId }, select: { title: true } }))?.title || auth.tenant.storeName,
      tagline: (await prisma.starterLink.findFirst({ where: { tenantId }, select: { tagline: true } }))?.tagline || 'Chat with us anytime.',
      greeting: (await prisma.starterLink.findFirst({ where: { tenantId }, select: { greeting: true } }))?.greeting || 'Hi! How can we help today?',
      buttonsJson: (await prisma.starterLink.findFirst({ where: { tenantId }, select: { buttonsJson: true } }))?.buttonsJson || '[]',
    },
    create: {
      tenantId,
      slug,
      published: true,
      title: auth.tenant.storeName,
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
