// src/app/onboarding/store/page.tsx

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import StoreStepClient from './StoreStepClient';

export default async function StoreStep() {
  const auth = await getAuthedUserAndTenant();
  if (!auth?.tenant?.id) redirect('/login');

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      storeName: true,
      websiteUrl: true,
      settingsJson: true,
    },
  });

  let settings: any = {};
  try {
    settings = tenant?.settingsJson ? JSON.parse(tenant.settingsJson) : {};
  } catch {
    settings = {};
  }

  return (
    <StoreStepClient
      initialStoreName={tenant?.storeName || ''}
      initialWebsiteUrl={tenant?.websiteUrl || ''}
      initialSupportEmail={settings.supportEmail || ''}
      initialCategory={settings.category || 'Fashion'}
    />
  );
}