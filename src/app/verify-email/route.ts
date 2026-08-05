// src/app/verify-email/route.ts

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { hashEmailVerificationToken } from '@/lib/emailVerification';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_LIFETIME_SECONDS =
  60 * 60 * 24 * 30;

function redirectToLogin(
  req: Request,
  result: string,
) {
  const url = new URL('/login', req.url);
  url.searchParams.set('verification', result);

  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const rawToken =
    requestUrl.searchParams.get('token')?.trim() || '';

  if (!rawToken) {
    return redirectToLogin(req, 'invalid');
  }

  const tokenHash =
    hashEmailVerificationToken(rawToken);

  const verificationToken =
    await prisma.emailVerificationToken.findUnique({
      where: {
        token: tokenHash,
      },
      include: {
        user: {
          include: {
            ownedTenants: {
              where: {
                isDeleted: false,
              },
            },
            memberships: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });

  if (!verificationToken) {
    return redirectToLogin(req, 'invalid');
  }

  if (
    verificationToken.usedAt ||
    verificationToken.user.emailVerifiedAt
  ) {
    return redirectToLogin(
      req,
      'already-verified',
    );
  }

  if (
    verificationToken.expiresAt <= new Date()
  ) {
    return redirectToLogin(req, 'expired');
  }

  const user = verificationToken.user;

  const memberTenants =
    user.memberships
      .map((membership) => membership.tenant)
      .filter((tenant) => !tenant.isDeleted);

  const tenant =
    user.ownedTenants[0] ||
    memberTenants[0];

  if (!tenant) {
    return redirectToLogin(req, 'no-store');
  }

  const sessionToken = crypto
    .randomBytes(32)
    .toString('hex');

  const sessionExpiresAt = new Date(
    Date.now() +
      SESSION_LIFETIME_SECONDS * 1000,
  );

  try {
    await prisma.$transaction(async (tx) => {
      const claimedToken =
        await tx.emailVerificationToken.updateMany({
          where: {
            id: verificationToken.id,
            usedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          data: {
            usedAt: new Date(),
          },
        });

      if (claimedToken.count !== 1) {
        throw new Error(
          'Verification token is no longer valid.',
        );
      }

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerifiedAt: new Date(),
        },
      });

      await tx.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt: sessionExpiresAt,
        },
      });
    });
  } catch (error) {
    console.error('[verify-email]', error);

    return redirectToLogin(req, 'invalid');
  }

  const destination = new URL(
    '/onboarding/store',
    req.url,
  );

  const response =
    NextResponse.redirect(destination);

  const secure =
    process.env.NODE_ENV === 'production';

  const privateCookie = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    maxAge: SESSION_LIFETIME_SECONDS,
  };

  const displayCookie = {
    path: '/',
    sameSite: 'lax' as const,
    secure,
    maxAge: SESSION_LIFETIME_SECONDS,
  };

  response.cookies.set(
    'tz_session',
    sessionToken,
    privateCookie,
  );

  response.cookies.set(
    'tz_tenant',
    tenant.id,
    privateCookie,
  );

  response.cookies.set(
    'tz_user_email',
    user.email,
    displayCookie,
  );

  response.cookies.set(
    'tz_user_name',
    user.name || '',
    displayCookie,
  );

  response.cookies.set(
    'tz_store_name',
    tenant.storeName,
    displayCookie,
  );

  return response;
}