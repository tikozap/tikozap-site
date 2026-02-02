// src/lib/entitlements.ts
import { BillingStatus, PlanTier } from "@prisma/client";

export type Entitlements = {
  // “hard” gates
  canUsePublicWidget: boolean;
  canPublishStarterLink: boolean;

  // limits (examples — adjust later)
  maxAllowedDomains: number;
  maxKnowledgeDocs: number;
  maxKnowledgeCharsPerMonth: number;
  maxConversationsPerMonth: number;
};

export function getEntitlements(plan: PlanTier): Entitlements {
  switch (plan) {
    case "STARTER":
      return {
        canUsePublicWidget: true,
        canPublishStarterLink: true,
        maxAllowedDomains: 1,
        maxKnowledgeDocs: 3,
        maxKnowledgeCharsPerMonth: 50_000,
        maxConversationsPerMonth: 25,
      };
    case "PRO":
      return {
        canUsePublicWidget: true,
        canPublishStarterLink: true,
        maxAllowedDomains: 3,
        maxKnowledgeDocs: 25,
        maxKnowledgeCharsPerMonth: 500_000,
        maxConversationsPerMonth: 500,
      };
    case "BUSINESS":
      return {
        canUsePublicWidget: true,
        canPublishStarterLink: true,
        maxAllowedDomains: 10,
        maxKnowledgeDocs: 200,
        maxKnowledgeCharsPerMonth: 5_000_000,
        maxConversationsPerMonth: 5000,
      };
    default:
      // exhaustive guard
      return {
        canUsePublicWidget: false,
        canPublishStarterLink: false,
        maxAllowedDomains: 0,
        maxKnowledgeDocs: 0,
        maxKnowledgeCharsPerMonth: 0,
        maxConversationsPerMonth: 0,
      };
  }
}

export function isBillingActiveOrTrialing(status: BillingStatus): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

/**
 * Use this to block public endpoints quickly (widget message ingest, widget settings, starter link, etc.)
 */
export function assertTenantCanUsePublicEndpoints(
  billingStatus: BillingStatus,
  trialEndsAt: Date | null | undefined
) {
  if (isBillingActiveOrTrialing(billingStatus)) return;

  // Optional: if you treat trialEndsAt as a “still ok” window, enforce here.
  // Example:
  // if (trialEndsAt && trialEndsAt.getTime() > Date.now()) return;

  throw new Error("BILLING_INACTIVE");
}
