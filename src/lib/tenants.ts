// src/lib/tenants.ts
import { prisma } from "@/lib/prisma";

export async function requireTenantAccess(userId: string, tenantId: string) {
  // Owner OR membership
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, ownerId: true },
  });

  if (!tenant) throw new Error("TENANT_NOT_FOUND");
  if (tenant.ownerId === userId) return;

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
    select: { id: true, role: true },
  });

  if (!membership) throw new Error("FORBIDDEN");
}
