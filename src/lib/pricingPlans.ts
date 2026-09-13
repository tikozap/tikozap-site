// src/lib/pricingPlans.ts

export type BillingPlan = 'starter' | 'pro' | 'business' | 'agency';

export const PRICING_PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    monthly: 19,
    yearly: 16,
    starterLinkProducts: 30,
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    monthly: 29,
    yearly: 24,
    starterLinkProducts: 90,
  },
  business: {
    key: 'business',
    name: 'Business',
    monthly: 59,
    yearly: 49,
    starterLinkProducts: null,
  },
  agency: {
    key: 'agency',
    name: 'Agency / White-label',
    monthly: 179,
    yearly: 179,
    starterLinkProducts: null,
  },
} as const;