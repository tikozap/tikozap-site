// src/lib/stripe.ts

import 'server-only';

import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  if (!client) {
    client = new Stripe(apiKey, {
      apiVersion: '2026-04-22.dahlia',
    });
  }

  return client;
}