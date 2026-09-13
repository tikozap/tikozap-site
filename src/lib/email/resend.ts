// src/lib/email/resend.ts

import 'server-only';

import { Resend } from 'resend';

let client: Resend | null = null;

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}