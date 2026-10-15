// src/app/api/onboarding/assistant/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { newWidgetPublicKey } from '@/lib/widgetKey';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

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
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
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

  const assistantName = String(body.assistantName || '').trim();
  const greeting = String(body.greeting || '').trim();
  const storeInfo = String(body.storeInfo || '').trim();

  if (!assistantName) {
    return NextResponse.json(
      { ok: false, error: 'Assistant name is required.' },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
  where: {
    id: auth.tenant.id,
  },
  select: {
    settingsJson: true,
  },
});

let currentSettings: Record<string, unknown> = {};

try {
  currentSettings = tenant?.settingsJson
    ? JSON.parse(tenant.settingsJson)
    : {};
} catch {
  currentSettings = {};
}

const nextSettings = {
  ...currentSettings,
  tz_assistant_name: assistantName,
  tz_assistant_greeting: greeting,
};

await prisma.tenant.update({
  where: {
    id: auth.tenant.id,
  },
  data: {
    settingsJson: JSON.stringify(nextSettings),
  },
});
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