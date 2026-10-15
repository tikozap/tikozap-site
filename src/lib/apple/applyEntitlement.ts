// src/lib/apple/applyEntitlement.ts

import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { entitlementOrderDecision } from './entitlementOrder';
import type { AppleBillingPlan } from './verifyTransaction';

type Input = {
  tenantId: string;
  transaction: {
    transactionId: string;
    originalTransactionId: string;
    productId: string;
    plan: AppleBillingPlan;
    purchasedAt: Date;
    signedAt: Date;
  };
  periodEnd: Date;
  activate?: boolean;
  notificationSignedAt?: Date;
};

export async function applyAppleEntitlement(input: Input) {
  const incoming = input.transaction;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.findUniqueOrThrow({
          where: { id: input.tenantId },
          select: {
            appleOriginalTransactionId: true,
            appleTransactionId: true,
            appleTransactionPurchasedAt: true,
            appleTransactionSignedAt: true,
            appleLastNotificationAt: true,
            stripeSubscriptionId: true,
            billingStatus: true,
          },
        });
        if (tenant.stripeSubscriptionId &&
            ['active', 'trialing', 'past_due'].includes(tenant.billingStatus ?? '')) {
          throw new Error('An active web subscription prevents Apple entitlement updates.');
        }
        if (tenant.appleOriginalTransactionId &&
            tenant.appleOriginalTransactionId !== incoming.originalTransactionId) {
          throw new Error('Apple subscription belongs to a different subscription chain.');
        }
        const decision = entitlementOrderDecision(tenant, {
          ...incoming,
          // Notification status and grace-period data are current as of the envelope date.
          signedAt: input.notificationSignedAt ?? incoming.signedAt,
        });
        console.info('[Apple entitlement decision]', {
  source: input.notificationSignedAt ? 'notification' : 'app',
  attempt: attempt + 1,
  incomingProduct: incoming.productId,
  incomingTransactionId: incoming.transactionId,
  incomingPurchasedAt: incoming.purchasedAt.toISOString(),
  incomingSignedAt: incoming.signedAt.toISOString(),
  notificationSignedAt: input.notificationSignedAt?.toISOString(),
  storedTransactionId: tenant.appleTransactionId,
  storedPurchasedAt: tenant.appleTransactionPurchasedAt?.toISOString(),
  storedSignedAt: tenant.appleTransactionSignedAt?.toISOString(),
  decision,
});

if (decision !== 'apply') {
  return { applied: false, reason: decision };
}
        await tx.tenant.update({
          where: { id: input.tenantId },
          data: {
            ...(input.activate ? { billingProvider: 'apple' } : {}),
            billingPlan: incoming.plan,
            billingInterval: 'monthly',
            appleProductId: incoming.productId,
            appleOriginalTransactionId: incoming.originalTransactionId,
            appleCurrentPeriodEnd: input.periodEnd,
            appleTransactionId: incoming.transactionId,
            appleTransactionPurchasedAt: incoming.purchasedAt,
            appleTransactionSignedAt: input.notificationSignedAt ?? incoming.signedAt,
            ...(input.notificationSignedAt &&
                (!tenant.appleLastNotificationAt || input.notificationSignedAt > tenant.appleLastNotificationAt)
              ? { appleLastNotificationAt: input.notificationSignedAt } : {}),
          },
        });
        return { applied: true, reason: 'applied' };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      console.info('[Apple entitlement completed]', {
  source: input.notificationSignedAt ? 'notification' : 'app',
  productId: incoming.productId,
  transactionId: incoming.transactionId,
  ...result,
});

return result;
    } catch (error) {
      console.error('[Apple entitlement failed]', {
  source: input.notificationSignedAt ? 'notification' : 'app',
  productId: incoming.productId,
  transactionId: incoming.transactionId,
  attempt: attempt + 1,
  code: (error as { code?: string })?.code,
  message: error instanceof Error ? error.message : String(error),
});
      if ((error as { code?: string }).code === 'P2034' && attempt < 3) continue;
      throw error;
    }
  }
  throw new Error('Apple entitlement update could not complete.');
}
