// src/lib/email/send.ts

import 'server-only';

import type { ReactNode } from 'react';

import { getResend } from './resend';

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: ReactNode;
};

const from =
  process.env.EMAIL_FROM ??
  'TikoZap <support@tikozap.com>';

export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailOptions) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    react,
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return data;
}