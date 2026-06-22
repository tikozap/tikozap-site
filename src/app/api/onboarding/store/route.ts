// src/app/api/onboarding/store/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const storeName = String(body.storeName || '').trim();
  const websiteUrl = String(body.websiteUrl || '').trim();
  const supportEmail = String(body.supportEmail || '').trim();
  const category = String(body.category || '').trim();

  if (!storeName) {
    return NextResponse.json(
      { ok: false, error: 'Store name is required.' },
      { status: 400 }
    );
  }

  const current = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: { settingsJson: true },
  });

  let settings: any = {};
  try {
    settings = current?.settingsJson ? JSON.parse(current.settingsJson) : {};
  } catch {
    settings = {};
  }

  settings.supportEmail = supportEmail;
  settings.category = category;

  const tenant = await prisma.tenant.update({
    where: { id: auth.tenant.id },
    data: {
      storeName,
      websiteUrl: websiteUrl || null,
      settingsJson: JSON.stringify(settings),
    },
  });

  return NextResponse.json({ ok: true, tenant });
}