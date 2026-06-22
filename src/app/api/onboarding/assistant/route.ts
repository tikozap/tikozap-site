// src/app/api/onboarding/assistant/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { newWidgetPublicKey } from '@/lib/widgetKey';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const assistantName = String(body.assistantName || '').trim();
  const greeting = String(body.greeting || '').trim();
  const storeInfo = String(body.storeInfo || '').trim();

  if (!assistantName) {
    return NextResponse.json(
      { ok: false, error: 'Assistant name is required.' },
      { status: 400 }
    );
  }

  await prisma.widget.upsert({
    where: { tenantId: auth.tenant.id },
    create: {
      tenantId: auth.tenant.id,
      publicKey: newWidgetPublicKey(),
      enabled: true,
      assistantName,
      greeting,
    },
    update: {
      assistantName,
      greeting,
    },
  });

  const existingStoreInfo = await prisma.knowledgeDoc.findFirst({
    where: {
      tenantId: auth.tenant.id,
      title: 'Store info',
    },
    select: { id: true },
  });

  if (existingStoreInfo) {
    await prisma.knowledgeDoc.update({
      where: { id: existingStoreInfo.id },
      data: { content: storeInfo },
    });
  } else {
    await prisma.knowledgeDoc.create({
      data: {
        tenantId: auth.tenant.id,
        title: 'Store info',
        content: storeInfo,
      },
    });
  }

  return NextResponse.json({ ok: true });
}