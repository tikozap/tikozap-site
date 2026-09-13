// src/lib/passwordResetEmail.ts

import 'server-only';

import { createElement } from 'react';

import { sendEmail } from '@/lib/email/send';
import PasswordResetEmail from '@/lib/email/templates/PasswordResetEmail';

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to,
    subject: 'Reset your TikoZap password',
    react: createElement(PasswordResetEmail, {
      resetUrl,
    }),
  });
}