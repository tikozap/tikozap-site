// src/app/api/auth/forgot-password/route.ts

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/passwordResetEmail';
import {
  checkRateLimit,
  rateLimitHeaders,
} from '@/lib/rateLimit';

export const runtime = 'nodejs';

function getBaseUrl(req: Request) {
  const envUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL;

  if (envUrl) {
    return envUrl.startsWith('http')
      ? envUrl.replace(/\/$/, '')
      : `https://${envUrl.replace(/\/$/, '')}`;
  }

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  const rate = checkRateLimit(req, {
  namespace: 'auth-forgot-password',
  limit: 5,
  windowMs: 15 * 60_000,
});

if (!rate.ok) {
  return NextResponse.json(
    {
      ok: true,
      message: 'If that email exists, a reset link has been sent.',
    },
    {
      status: 429,
      headers: rateLimitHeaders(rate),
    }
  );
}
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: 'Email is required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // Never reveal whether an email exists.
  if (!user) {
    return NextResponse.json({
      ok: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      usedAt: new Date(),
    },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const resetUrl = `${getBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;

try {
  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
  });
} catch (error) {
  console.error(
    '[forgot-password] Reset email delivery failed:',
    error
  );

  await prisma.passwordResetToken
    .delete({
      where: {
        token,
      },
    })
    .catch(() => undefined);

  return NextResponse.json(
    {
      ok: false,
      error:
        'We could not send the reset email. Please try again.',
    },
    {
      status: 500,
    }
  );
}

  return NextResponse.json({
    ok: true,
    message: 'If that email exists, a reset link has been sent.',
    resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
  });
}