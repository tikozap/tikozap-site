import { NextResponse } from 'next/server';

import { getAuthedUserAndTenant } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';
import { verifyAppleSubscriptionTransaction } from '@/lib/apple/verifyTransaction';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid request origin.',
      },
      {
        status: 403,
      }
    );
  }

  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Authentication required.',
      },
      {
        status: 401,
      }
    );
  }

  if (auth.tenant.role !== 'owner') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Owner access required.',
      },
      {
        status: 403,
      }
    );
  }

  const body: unknown = await req.json().catch(() => null);

  const signedTransaction =
    body &&
    typeof body === 'object' &&
    'signedTransaction' in body &&
    typeof body.signedTransaction === 'string'
      ? body.signedTransaction.trim()
      : '';

  if (!signedTransaction) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Signed App Store transaction required.',
      },
      {
        status: 400,
      }
    );
  }

  let verified;

  try {
    verified =
      await verifyAppleSubscriptionTransaction(
        signedTransaction
      );
  } catch (error) {
    console.error(
      'Apple subscription verification failed:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to verify App Store subscription.',
      },
      {
        status: 400,
      }
    );
  }

  const now = new Date();

  if (verified.expiresAt.getTime() <= now.getTime()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'App Store subscription has expired.',
      },
      {
        status: 400,
      }
    );
  }

  const existingOwner = await prisma.tenant.findUnique({
    where: {
      appleOriginalTransactionId:
        verified.originalTransactionId,
    },
    select: {
      id: true,
    },
  });

  if (
    existingOwner &&
    existingOwner.id !== auth.tenant.id
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'This App Store subscription is already linked to another store.',
      },
      {
        status: 409,
      }
    );
  }

  try {
    await prisma.tenant.update({
      where: {
        id: auth.tenant.id,
      },
      data: {
        billingProvider: 'apple',
        billingPlan: verified.plan,
        billingInterval: 'monthly',
        appleProductId: verified.productId,
        appleOriginalTransactionId:
          verified.originalTransactionId,
        appleCurrentPeriodEnd: verified.expiresAt,
      },
    });
  } catch (error) {
    console.error(
      'Unable to save Apple subscription entitlement:',
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: 'Unable to activate App Store subscription.',
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    ok: true,
    plan: verified.plan,
    productId: verified.productId,
    expiresAt: verified.expiresAt.toISOString(),
  });
}
