// src/lib/auth.ts

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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
  billingStatus: string | null;
  billingInterval: string | null;
  starterLinkSlug: string | null;
  starterLinkEnabled: boolean | null;
  role: 'owner' | 'staff';
};
};

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('tz_session')?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      userId: true,
      expiresAt: true,
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.userId;
}

export async function getAuthedUserAndTenant(): Promise<AuthedUserAndTenant | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get('tz_session')?.value;
  const tenantCookie = cookieStore.get('tz_tenant')?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          ownedTenants: true,
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  const ownedTenants =
  (session.user.ownedTenants || []).filter(
    (t) => !t.isDeleted
  );
  const memberTenants =
  session.user.memberships
    .map((m) => m.tenant)
    .filter((t) => !t.isDeleted);
  const allTenants = [...ownedTenants, ...memberTenants];

  const tenant =
    allTenants.find((t) => t.id === tenantCookie) ||
    ownedTenants[0] ||
    memberTenants[0];

  if (!tenant) return null;

  const isOwner = ownedTenants.some(
  (ownedTenant) => ownedTenant.id === tenant.id
);

const membership = session.user.memberships.find(
  (m) => m.tenantId === tenant.id
);

const role: 'owner' | 'staff' =
  isOwner || membership?.role === 'owner'
    ? 'owner'
    : 'staff';

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
tenant: {
  id: tenant.id,
  slug: tenant.slug,
  storeName: tenant.storeName,
  billingPlan: tenant.billingPlan,
  billingStatus: tenant.billingStatus,
  billingInterval: tenant.billingInterval,
  starterLinkSlug: tenant.starterLinkSlug,
  starterLinkEnabled: tenant.starterLinkEnabled,
  role,
},
  };
}