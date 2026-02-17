import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

function linkFor(slug: string): string {
  return `https://app.tikozap.com/s/${slug}`;
}

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const slug = auth.tenant.starterLinkSlug || auth.tenant.slug;
  return NextResponse.json({
    ok: true,
    starterLink: {
      enabled: auth.tenant.starterLinkEnabled,
      slug,
      url: linkFor(slug),
    },
  });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const slugRaw = typeof body.slug === 'string' ? body.slug : '';
  const enabled = body.enabled === false ? false : true;

  const normalized = toSlug(slugRaw) || auth.tenant.slug;
  if (!isValidSlug(normalized)) {
    return NextResponse.json(
      { ok: false, error: 'Starter Link slug must be 3-64 chars (a-z, 0-9, hyphen).' },
      { status: 400 },
    );
  }

  try {
    const tenant = await prisma.tenant.update({
      where: { id: auth.tenant.id },
      data: {
        starterLinkSlug: normalized,
        starterLinkEnabled: enabled,
      },
      select: {
        id: true,
        starterLinkSlug: true,
        starterLinkEnabled: true,
        slug: true,
      },
    });

    const slug = tenant.starterLinkSlug || tenant.slug;
    return NextResponse.json({
      ok: true,
      starterLink: {
        enabled: tenant.starterLinkEnabled,
        slug,
        url: linkFor(slug),
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
      { ok: false, error: 'Could not save Starter Link settings.' },
      { status: 500 },
    );
  }
}
