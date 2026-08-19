// src/app/api/cron/trial-reminders/route.ts

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import {
  sendTrialLifecycleEmail,
} from '@/lib/email/trialEmails';
import type {
  TrialEmailStage,
} from '@/lib/email/templates/TrialLifecycleEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

type ReminderField =
  | 'trialReminder7SentAt'
  | 'trialReminder5SentAt'
  | 'trialReminder1SentAt'
  | 'trialExpiredEmailSentAt';

type ReminderDecision = {
  stage: TrialEmailStage;
  field: ReminderField;
};

function chooseReminder(
  now: Date,
  tenant: {
    trialEndsAt: Date | null;
    trialReminder7SentAt: Date | null;
    trialReminder5SentAt: Date | null;
    trialReminder1SentAt: Date | null;
    trialExpiredEmailSentAt: Date | null;
  },
): ReminderDecision | null {
  if (!tenant.trialEndsAt) return null;

  const remainingMs =
    tenant.trialEndsAt.getTime() - now.getTime();

  /*
   * Expiration has the highest priority.
   */
  if (
    remainingMs <= 0 &&
    !tenant.trialExpiredEmailSentAt
  ) {
    return {
      stage: 'expired',
      field: 'trialExpiredEmailSentAt',
    };
  }

  /*
   * Only send the closest relevant reminder.
   *
   * This prevents sending multiple overdue reminders
   * together if a cron run was missed.
   */
  if (
    remainingMs > 0 &&
    remainingMs <= DAY_MS &&
    !tenant.trialReminder1SentAt
  ) {
    return {
      stage: '1-day',
      field: 'trialReminder1SentAt',
    };
  }

  if (
    remainingMs > DAY_MS &&
    remainingMs <= 5 * DAY_MS &&
    !tenant.trialReminder5SentAt
  ) {
    return {
      stage: '5-days',
      field: 'trialReminder5SentAt',
    };
  }

  if (
    remainingMs > 5 * DAY_MS &&
    remainingMs <= 7 * DAY_MS &&
    !tenant.trialReminder7SentAt
  ) {
    return {
      stage: '7-days',
      field: 'trialReminder7SentAt',
    };
  }

  return null;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization =
    req.headers.get('authorization');

  if (
    !cronSecret ||
    authorization !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(
    now.getTime() + 7 * DAY_MS,
  );

  const url = new URL(req.url);

  const requestedTenantId =
    process.env.NODE_ENV !== 'production'
      ? url.searchParams.get('tenantId')
      : null;

  /*
   * Only retrieve tenants whose trial is ending
   * within seven days or has already expired.
   */
  const tenants = await prisma.tenant.findMany({
    where: {
      isDeleted: false,

      ...(requestedTenantId
        ? { id: requestedTenantId }
        : {}),

      trialEndsAt: {
        lte: sevenDaysFromNow,
      },
    },

    select: {
      id: true,
      storeName: true,

      billingStatus: true,
      stripeSubscriptionId: true,

      trialEndsAt: true,
      trialReminder7SentAt: true,
      trialReminder5SentAt: true,
      trialReminder1SentAt: true,
      trialExpiredEmailSentAt: true,

      owner: {
        select: {
          email: true,
          name: true,
        },
      },

      widget: {
        select: {
          assistantName: true,
        },
      },
    },

    orderBy: {
      trialEndsAt: 'asc',
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const results: Array<{
    tenantId: string;
    stage?: TrialEmailStage;
    status: 'sent' | 'skipped' | 'failed';
    error?: string;
  }> = [];

  for (const tenant of tenants) {
    /*
     * A real paid Stripe subscription overrides the
     * free-trial lifecycle.
     */
    const hasPaidAccess =
      Boolean(tenant.stripeSubscriptionId) &&
      (
        tenant.billingStatus === 'active' ||
        tenant.billingStatus === 'trialing'
      );

    if (hasPaidAccess) {
      skipped += 1;

      results.push({
        tenantId: tenant.id,
        status: 'skipped',
      });

      continue;
    }

    const reminder = chooseReminder(
      now,
      tenant,
    );

    if (!reminder) {
      skipped += 1;

      results.push({
        tenantId: tenant.id,
        status: 'skipped',
      });

      continue;
    }

    try {
      await sendTrialLifecycleEmail({
        stage: reminder.stage,
        to: tenant.owner.email,
        merchantName: tenant.owner.name,
        storeName:
          tenant.storeName || 'Your Store',
        assistantName:
          tenant.widget?.assistantName || null,
        trialEndsAt: tenant.trialEndsAt,
      });

      await prisma.tenant.update({
        where: {
          id: tenant.id,
        },
        data: {
          [reminder.field]: now,
        },
      });

      sent += 1;

      results.push({
        tenantId: tenant.id,
        stage: reminder.stage,
        status: 'sent',
      });
    } catch (error: any) {
      failed += 1;

      console.error(
        '[trial-reminder-email]',
        {
          tenantId: tenant.id,
          stage: reminder.stage,
          error:
            error?.message ||
            'Unknown email error',
        },
      );

      results.push({
        tenantId: tenant.id,
        stage: reminder.stage,
        status: 'failed',
        error:
          error?.message ||
          'Unknown email error',
      });
    }
  }

return NextResponse.json(
  {
    ok: failed === 0,
    checked: tenants.length,
    sent,
    skipped,
    failed,
    ranAt: now.toISOString(),
    results,
  },
  {
    status: failed === 0 ? 200 : 500,
  },
);
}