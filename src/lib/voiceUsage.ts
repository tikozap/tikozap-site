// src/lib/voiceUsage.ts

import 'server-only';

import { prisma } from '@/lib/prisma';

export type VoiceUsageSummary = {
  enabled: boolean;

  pack: string | null;

  usedMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;

  utilizationPct: number;

  periodStart: string | null;

  freeQuestionsLimitDaily: number;
  freeQuestionsUsedToday: number;
  freeQuestionsRemainingToday: number;
  freeQuestionsDate: string | null;
  freeQuestionsTotal: number;
};

const FREE_VOICE_QUESTIONS_PER_DAY = 20;

function startOfTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
}

export async function getTenantVoiceUsage(
  tenantId: string
): Promise<VoiceUsageSummary> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      voiceEnabled: true,
      voicePack: true,

      voiceMinutesLimit: true,
      voiceMinutesUsed: true,
      voiceUsagePeriodStart: true,

      voiceQuestionsToday: true,
      voiceQuestionsDate: true,
      voiceQuestionsTotal: true,
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const todayStart = startOfTodayUtc();

  const needsDailyQuestionReset =
    !tenant.voiceQuestionsDate || tenant.voiceQuestionsDate < todayStart;

  if (needsDailyQuestionReset) {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(needsDailyQuestionReset
          ? {
              voiceQuestionsToday: 0,
              voiceQuestionsDate: todayStart,
            }
          : {}),
      },
      select: {
        voiceEnabled: true,
        voicePack: true,

        voiceMinutesLimit: true,
        voiceMinutesUsed: true,
        voiceUsagePeriodStart: true,

        voiceQuestionsToday: true,
        voiceQuestionsDate: true,
        voiceQuestionsTotal: true,
      },
    });

    Object.assign(tenant, updated);
  }

  const limit = tenant.voiceMinutesLimit || 0;
  const used = tenant.voiceMinutesUsed || 0;
  const remaining = Math.max(0, limit - used);

  const utilizationPct =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const questionsUsedToday = tenant.voiceQuestionsToday || 0;

  return {
    enabled: tenant.voiceEnabled,

    pack: tenant.voicePack,

    usedMinutes: used,
    limitMinutes: limit,
    remainingMinutes: remaining,

    utilizationPct,

    periodStart: tenant.voiceUsagePeriodStart
      ? tenant.voiceUsagePeriodStart.toISOString()
      : null,

    freeQuestionsLimitDaily: FREE_VOICE_QUESTIONS_PER_DAY,
    freeQuestionsUsedToday: questionsUsedToday,
    freeQuestionsRemainingToday: Math.max(
      0,
      FREE_VOICE_QUESTIONS_PER_DAY - questionsUsedToday
    ),
    freeQuestionsDate: tenant.voiceQuestionsDate
      ? tenant.voiceQuestionsDate.toISOString()
      : null,
    freeQuestionsTotal: tenant.voiceQuestionsTotal || 0,
  };
}

export async function incrementVoiceUsage(
  tenantId: string,
  minutesToAdd: number
) {
  const usage = await getTenantVoiceUsage(tenantId);

  const hasFreeQuestionRemaining =
    usage.freeQuestionsUsedToday < usage.freeQuestionsLimitDaily;

  const hasPaidVoiceMinutes =
    usage.enabled &&
    usage.limitMinutes > 0 &&
    usage.usedMinutes + minutesToAdd <= usage.limitMinutes;

  if (!hasFreeQuestionRemaining && !hasPaidVoiceMinutes) {
    return {
      ok: false,
      reason: 'VOICE_LIMIT_REACHED',
    };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      voiceQuestionsToday: {
        increment: 1,
      },
      voiceQuestionsTotal: {
        increment: 1,
      },

      ...(hasPaidVoiceMinutes && !hasFreeQuestionRemaining
        ? {
            voiceMinutesUsed: {
              increment: minutesToAdd,
            },
          }
        : {}),
    },
  });

  return {
    ok: true,
  };
}