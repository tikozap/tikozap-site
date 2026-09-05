// src/app/api/auth/signup/route.ts

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { sendVerificationEmailForUser } from '@/lib/emailVerification';
import { prisma } from '@/lib/prisma';
import { newWidgetPublicKey } from '@/lib/widgetKey';
import {
  checkRateLimit,
  rateLimitHeaders,
} from '@/lib/rateLimit';

export const runtime = 'nodejs';

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) ||
    `store-${Math.random().toString(16).slice(2, 8)}`
  );
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString('hex');

  return `${salt}:${hash}`;
}

export async function POST(req: Request) {
  const rate = checkRateLimit(req, {
  namespace: 'auth-signup',
  limit: 5,
  windowMs: 15 * 60_000,
});

if (!rate.ok) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Too many signup attempts. Please try again later.',
    },
    {
      status: 429,
      headers: rateLimitHeaders(rate),
    }
  );
}
  const body = await req.json().catch(() => ({}));

  const name = String(body.name || '').trim();
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const password = String(body.password || '');
  const storeUrl = String(body.storeUrl || '').trim();
  const hasWebsite = body.hasWebsite === 'yes';
  const storeName =
    String(body.storeName || '').trim() || 'My Store';

  if (!name || !email || !password) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing required fields.',
      },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Password must be at least 8 characters.',
      },
      { status: 400 },
    );
  }

  if (hasWebsite && !storeUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Store URL is required when you have a website.',
      },
      { status: 400 },
    );
  }

  const baseSlug = slugify(
    hasWebsite ? storeUrl : storeName,
  );

  let slug = baseSlug;

  for (let i = 0; i < 5; i++) {
    const existing =
      await prisma.tenant.findUnique({
        where: { slug },
      });

    if (!existing) break;

    slug = `${baseSlug}-${Math.random()
      .toString(16)
      .slice(2, 6)}`;
  }

  let createdUserId: string | null = null;

try {
  const passwordHash = hashPassword(password);

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(
    trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000
  );

  const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        emailVerifiedAt: null,

        ownedTenants: {
          create: {
            slug,
            storeName,
        billingPlan: 'pro',
        billingStatus: 'trialing',
        trialStartedAt,
        trialEndsAt,

            // Website stores use Widget only.
            // No-website stores use Starter Link.
            starterLinkSlug: hasWebsite
              ? null
              : slug,
            starterLinkEnabled: !hasWebsite,

            memberships: {
              create: {
                role: 'owner',
                user: {
                  connect: { email },
                },
              },
            },

            widget: {
              create: {
                publicKey: newWidgetPublicKey(),
                enabled: true,
                assistantName:
                  `${storeName} Assistant`,
                greeting:
                  'Hi! I can help with products, order tracking, shipping, and returns.',
                brandColor: '#111827',
              },
            },

            starterLinkPage: hasWebsite
              ? undefined
              : {
                  create: {
                    tagline:
                      'Instant support, no website needed.',
                    subheading:
                      'Ask us about products, orders, shipping, and returns.',
                    footerLine:
                      `${storeName} powered by TikoZap`,
                  },
                },
          },
        },
      },

      select: {
        id: true,
        email: true,
      },
    });

    createdUserId = user.id;

    await sendVerificationEmailForUser(user.id);

    return NextResponse.json({
      ok: true,
      verificationRequired: true,
      email: user.email,
    });
  } catch (err: any) {
    /*
     * If account creation succeeded but the first
     * verification email could not be sent, remove this
     * brand-new account so the merchant can retry signup.
     */
    if (createdUserId) {
      await prisma.user
        .delete({
          where: {
            id: createdUserId,
          },
        })
        .catch((cleanupError) => {
          console.error(
            '[signup-cleanup]',
            cleanupError,
          );
        });
    }

    if (err?.code === 'P2002') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'An account with this email already exists.',
        },
        { status: 409 },
      );
    }

    console.error('[signup]', err);

    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ||
          'Could not create account.',
      },
      { status: 500 },
    );
  }
}