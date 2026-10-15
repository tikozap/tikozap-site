// src/lib/emailVerification.ts

import 'server-only';

import crypto from 'node:crypto';
import { createElement } from 'react';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send';
import VerifyEmail from '@/lib/email/templates/VerifyEmail';

const VERIFICATION_TOKEN_LIFETIME_MS =
  24 * 60 * 60 * 1000;

function getAppUrl() {
  const value =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.tikozap.com';

  return value.trim().replace(/\/+$/, '');
}

function hashVerificationToken(token: string) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

export async function sendVerificationEmailForUser(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  if (user.emailVerifiedAt) {
    return {
      alreadyVerified: true,
    };
  }

  /*
   * Invalidate any previous unused verification links.
   */
  await prisma.emailVerificationToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  /*
   * The raw token is sent to the user.
   * Only its SHA-256 hash is stored in the database.
   */
  const rawToken = crypto
    .randomBytes(32)
    .toString('hex');

  const tokenHash =
    hashVerificationToken(rawToken);

  const expiresAt = new Date(
    Date.now() +
      VERIFICATION_TOKEN_LIFETIME_MS,
  );

  const verificationToken =
    await prisma.emailVerificationToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt,
      },
      select: {
        id: true,
      },
    });

  const verifyUrl =
    `${getAppUrl()}/verify-email?token=` +
    encodeURIComponent(rawToken);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your TikoZap account',
      react: createElement(VerifyEmail, {
        name: user.name || 'there',
        verifyUrl,
      }),
    });
  } catch (error) {
    /*
     * Remove the unusable token if email delivery fails.
     */
    await prisma.emailVerificationToken
      .delete({
        where: {
          id: verificationToken.id,
        },
      })
      .catch(() => undefined);

    throw error;
  }

  return {
    alreadyVerified: false,
    expiresAt,
  };
}

export function hashEmailVerificationToken(
  rawToken: string,
) {
  return hashVerificationToken(rawToken);
}