// src/lib/stripe.ts
import Stripe from "stripe";
import { PlanTier } from "@prisma/client";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  // Don’t crash build; crash only when used.
  // This file can be imported safely in dev without keys.
  // Routes that call stripe() will throw a clearer error.
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20" as any,
  });
}

// Map your PlanTier -> Stripe Price IDs (env-configured)
export function getPriceIdForPlan(plan: PlanTier): string {
  const starter = process.env.STRIPE_PRICE_STARTER;
  const pro = process.env.STRIPE_PRICE_PRO;
  const business = process.env.STRIPE_PRICE_BUSINESS;

  if (plan === "STARTER") {
    if (!starter) throw new Error("Missing STRIPE_PRICE_STARTER");
    return starter;
  }
  if (plan === "PRO") {
    if (!pro) throw new Error("Missing STRIPE_PRICE_PRO");
    return pro;
  }
  if (plan === "BUSINESS") {
    if (!business) throw new Error("Missing STRIPE_PRICE_BUSINESS");
    return business;
  }

  // exhaustive guard
  throw new Error(`Unsupported plan tier: ${plan}`);
}

export function getAppUrlFromRequest(req: Request): string {
  // Prefer explicit env in production; fallback to request origin.
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const url = new URL(req.url);
  return url.origin;
}
