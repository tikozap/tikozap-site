// src/lib/demoAuth.ts

import { cookies } from 'next/headers';

export async function getDemoSession() {
  const cookieStore = await cookies();

  const session = cookieStore.get('tz_session')?.value;
  const tenantId = cookieStore.get('tz_tenant')?.value;
  const userEmail = cookieStore.get('tz_user_email')?.value || 'owner@demo-boutique.demo';
  const userName = cookieStore.get('tz_user_name')?.value || 'Demo Owner';
  const storeName = cookieStore.get('tz_store_name')?.value || 'Demo Boutique';

  if (!session || !tenantId) return null;

  return {
    user: {
      id: 'demo-user',
      email: userEmail,
      name: userName,
    },
    tenant: {
      id: tenantId,
      slug: 'demo-boutique',
      storeName,
    },
    isDemo: true,
  };
}