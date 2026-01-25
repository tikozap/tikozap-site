// src/app/api/starter-link/qr/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LINK_BASE = process.env.NEXT_PUBLIC_LINK_BASE || 'https://link.tikozap.com';

function safeSlug(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function tenantDisplayName(t: unknown) {
  const anyT = t as any;
  return String(anyT?.storeName || anyT?.name || 'Your store');
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

export async function GET(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const size = Math.max(120, Math.min(420, Number(searchParams.get('size') || '220')));

  const tenantId = auth.tenant.id;

  // Ensure link exists
  let link = await prisma.starterLink.findFirst({ where: { tenantId } });

  if (!link) {
    const anyT = auth.tenant as any;

    const base = safeSlug(
      String(anyT?.slug || anyT?.storeName || anyT?.name || 'your-store')
    );

    const slug = await uniqueSlug(base);

    link = await prisma.starterLink.create({
      data: {
        tenantId,
        slug,
        published: false,
        title: tenantDisplayName(auth.tenant),
        tagline: 'Chat with us anytime.',
        greeting: 'Hi! How can we help today?',
        buttonsJson: '[]',
      },
    });
  }

  const url = `${LINK_BASE}/l/${encodeURIComponent(link.slug)}`;

  // Generate SVG QR
  const QRCode = (await import('qrcode')).default;
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    width: size,
  });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
