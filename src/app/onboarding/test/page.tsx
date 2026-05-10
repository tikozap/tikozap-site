// src/app/onboarding/test/page.tsx

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { newWidgetPublicKey, isTzWidgetKey } from '@/lib/widgetKey';
import OnboardingTestClient from './test-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OnboardingTestPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tz_tenant')?.value;

  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          slug: true,
          storeName: true,
          starterLinkEnabled: true,
          widget: {
            select: {
              publicKey: true,
              installedAt: true,
            },
          },
        },
      })
    : null;

  if (!tenant) {
    return (
      <OnboardingTestClient
        widgetPublicKey="tz_demo_demo"
        storeName="Your Store"
        tenantSlug="your-store"
      />
    );
  }

  const widgetRow = tenant.widget
    ? tenant.widget
    : await prisma.widget.create({
        data: {
          tenantId: tenant.id,
          publicKey: newWidgetPublicKey(),
          enabled: true,
        },
        select: {
          publicKey: true,
          installedAt: true,
        },
      });

  let widgetPublicKey = widgetRow.publicKey;

  const canRotate = process.env.NODE_ENV !== 'production' || !widgetRow.installedAt;

  if (!isTzWidgetKey(widgetPublicKey) && canRotate) {
    const rotated = await prisma.widget.update({
      where: { tenantId: tenant.id },
      data: { publicKey: newWidgetPublicKey() },
      select: { publicKey: true },
    });

    widgetPublicKey = rotated.publicKey;
  }

  return (
    <OnboardingTestClient
      widgetPublicKey={widgetPublicKey}
      storeName={tenant.storeName || 'Your Store'}
      tenantSlug={tenant.slug || 'your-store'}
    />
  );
}