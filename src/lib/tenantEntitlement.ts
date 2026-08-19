// src/lib/tenantEntitlement.ts

import 'server-only';

import { prisma } from '@/lib/prisma';

export type TenantEntitlementState =
  | 'paid'
  | 'trial'
  | 'trial_expired';

export type TenantEntitlement = {
  ok: boolean;
  state: TenantEntitlementState;
  billingStatus: string | null;
  trialEndsAt: string | null;
};

export const TRIAL_PAUSED_VISITOR_MESSAGE =
  "I’m sorry, but I’m temporarily unavailable right now.\n\n" +
  "Please contact the store directly if you need assistance. I hope to be back soon!";

export const TRIAL_PAUSED_MERCHANT_MESSAGE =
  "Your 14-day Pro trial has ended. Your assistant, knowledge, conversations, and settings are safely preserved. Choose a plan in Billing whenever you’re ready to continue.";

export async function getTenantEntitlement(
  tenantId: string,
  now = new Date()
): Promise<TenantEntitlement> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      billingStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  /*
   * A real Stripe subscription is authoritative.
   *
   * cancel_at_period_end subscriptions remain "active"
   * until Stripe sends customer.subscription.deleted,
   * so merchants keep access through their paid period.
   */
  const hasPaidAccess =
    Boolean(tenant.stripeSubscriptionId) &&
    (tenant.billingStatus === 'active' ||
      tenant.billingStatus === 'trialing');

  if (hasPaidAccess) {
    return {
      ok: true,
      state: 'paid',
      billingStatus: tenant.billingStatus,
      trialEndsAt: tenant.trialEndsAt
        ? tenant.trialEndsAt.toISOString()
        : null,
    };
  }

  const hasActiveTrial =
    Boolean(tenant.trialEndsAt) &&
    tenant.trialEndsAt!.getTime() > now.getTime();

  if (hasActiveTrial) {
    return {
      ok: true,
      state: 'trial',
      billingStatus: tenant.billingStatus,
      trialEndsAt: tenant.trialEndsAt!.toISOString(),
    };
  }

  return {
    ok: false,
    state: 'trial_expired',
    billingStatus: tenant.billingStatus,
    trialEndsAt: tenant.trialEndsAt
      ? tenant.trialEndsAt.toISOString()
      : null,
  };
}