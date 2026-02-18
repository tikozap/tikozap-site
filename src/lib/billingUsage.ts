import 'server-only';

import { prisma } from '@/lib/prisma';

export const PLAN_LIMITS = {
  starter: 1000,
  pro: 5000,
  business: 15000,
} as const;

export type BillingPlan = keyof typeof PLAN_LIMITS;

export type BillingUsageSummary = {
  plan: BillingPlan;
  monthlyLimit: number;
  usedConversations: number;
  remainingConversations: number;
  utilizationPct: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  windowStart: string;
  windowEnd: string;
};

export function normalizeBillingPlan(input: unknown): BillingPlan {
  const lowered = typeof input === 'string' ? input.toLowerCase().trim() : '';
  if (lowered === 'pro') return 'pro';
  if (lowered === 'business') return 'business';
  return 'starter';
}

function monthWindow(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

function summarize(plan: BillingPlan, usedConversations: number, start: Date, end: Date): BillingUsageSummary {
  const monthlyLimit = PLAN_LIMITS[plan];
  const remainingConversations = Math.max(0, monthlyLimit - usedConversations);
  const utilizationPct = monthlyLimit
    ? Math.min(100, Math.round((usedConversations / monthlyLimit) * 100))
    : 0;
  return {
    plan,
    monthlyLimit,
    usedConversations,
    remainingConversations,
    utilizationPct,
    isNearLimit: utilizationPct >= 80 && usedConversations < monthlyLimit,
    isOverLimit: usedConversations >= monthlyLimit,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
  };
}

export async function getTenantBillingUsage(tenantId: string): Promise<BillingUsageSummary> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { billingPlan: true },
  });
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const plan = normalizeBillingPlan(tenant.billingPlan);
  const window = monthWindow();
  const usedConversations = await prisma.conversation.count({
    where: {
      tenantId,
      createdAt: {
        gte: window.start,
        lt: window.end,
      },
    },
  });

  return summarize(plan, usedConversations, window.start, window.end);
}

export async function setTenantBillingPlan(tenantId: string, plan: BillingPlan) {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { billingPlan: plan },
  });
  return getTenantBillingUsage(tenantId);
}

export async function canCreateConversationForTenant(tenantId: string): Promise<{
  ok: boolean;
  usage: BillingUsageSummary;
}> {
  const usage = await getTenantBillingUsage(tenantId);
  return {
    ok: !usage.isOverLimit,
    usage,
  };
}
