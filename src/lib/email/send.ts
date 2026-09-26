// src/lib/email/send.ts

import 'server-only';

import type { ReactNode } from 'react';

import { getResend } from './resend';

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: ReactNode;
  idempotencyKey?: string;
};

const from =
  process.env.EMAIL_FROM ??
  'TikoZap <support@tikozap.com>';

export async function sendEmail({
  to,
  subject,
  react,
  idempotencyKey,
}: SendEmailOptions) {
  const resend = getResend();

  const { data, error } = await resend.emails.send(
    {
      from,
      to,
      subject,
      react,
    },
    idempotencyKey
      ? { idempotencyKey }
      : undefined
  );

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return data;
}