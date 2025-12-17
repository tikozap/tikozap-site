import 'server-only';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getAuthedUserAndTenant() {
  const jar = cookies();
  const token = jar.get('tz_session')?.value || '';
  const tenantId = jar.get('tz_tenant')?.value || '';

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  const user = session.user;

  if (tenantId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      include: { tenant: true },
    });
    if (membership?.tenant) return { user, tenant: membership.tenant };
  }

  const firstMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!firstMembership?.tenant) return null;
  return { user, tenant: firstMembership.tenant };
}
