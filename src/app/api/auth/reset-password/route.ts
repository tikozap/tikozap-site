// src/app/api/auth/reset-password/route.ts

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  checkRateLimit,
  rateLimitHeaders,
} from '@/lib/rateLimit';

export const runtime = 'nodejs';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: Request) {
  const rate = checkRateLimit(req, {
  namespace: 'auth-reset-password',
  limit: 10,
  windowMs: 15 * 60_000,
});

if (!rate.ok) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Too many reset attempts. Please try again later.',
    },
    {
      status: 429,
      headers: rateLimitHeaders(rate),
    }
  );
}
  const body = await req.json().catch(() => ({}));

  const token = String(body.token || '').trim();
  const password = String(body.password || '');

  if (!token || !password) {
    return NextResponse.json(
      { ok: false, error: 'Token and password are required.' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true },
      },
    },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt <= new Date()
  ) {
    return NextResponse.json(
      { ok: false, error: 'This reset link is invalid or expired.' },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: hashPassword(password),
      },
    }),

    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    }),

    prisma.session.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: 'Password has been reset.',
  });
}