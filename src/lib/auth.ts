// src/lib/auth.ts
import { cookies } from 'next/headers';

type AuthedUserAndTenant = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
  tenant: {
    id: string;
    slug: string | null;
    storeName: string | null;
    billingPlan: string | null;
    starterLinkSlug: string | null;
    starterLinkEnabled: boolean | null;
  };
};

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('tz_session')?.value;
  if (!session) return null;
  return 'demo-user';
}

export async function getAuthedUserAndTenant(): Promise<AuthedUserAndTenant | null> {
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
      billingPlan: 'pro',
      starterLinkSlug: 'demo-boutique',
      starterLinkEnabled: true,
    },
  };
}