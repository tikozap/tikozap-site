// src/app/api/onboarding/store/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

function safeWebUrl(value: unknown) {
  const raw = String(value || '').trim();

  if (!raw) return null;

  try {
    const url = new URL(raw);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

export const runtime = 'nodejs';

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

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

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

  const ownerName = String(body.ownerName || '').trim();
  const storeName = String(body.storeName || '').trim();
  const websiteUrl = String(body.websiteUrl || '').trim();
  const supportEmail = String(body.supportEmail || '').trim();
  const category = String(body.category || '').trim();

  if (!storeName) {
    return NextResponse.json(
      { ok: false, error: 'Store name is required.' },
      { status: 400 },
    );
  }

  const current = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      settingsJson: true,
      owner: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json(
      { ok: false, error: 'Store not found.' },
      { status: 404 },
    );
  }

  let settings: any = {};

  try {
    settings = current.settingsJson
      ? JSON.parse(current.settingsJson)
      : {};
  } catch {
    settings = {};
  }

  settings.supportEmail = supportEmail;
  settings.category = category;

  const tenant = await prisma.tenant.update({
    where: { id: auth.tenant.id },
    data: {
      storeName,
      websiteUrl: safeWebUrl(websiteUrl),
      settingsJson: JSON.stringify(settings),
    },
  });

  await prisma.user.update({
    where: {
      id: current.owner.id,
    },
    data: {
      name: ownerName || null,
    },
  });

  return NextResponse.json({
    ok: true,
    tenant,
  });
}