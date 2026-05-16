// src/lib/voiceUsage.ts

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
};

function startOfCurrentMonthUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0,
      0,
      0,
      0
    )
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
    },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentMonthStart = startOfCurrentMonthUtc();

  const needsReset =
    !tenant.voiceUsagePeriodStart ||
    tenant.voiceUsagePeriodStart < currentMonthStart;

  if (needsReset) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        voiceMinutesUsed: 0,
        voiceUsagePeriodStart: currentMonthStart,
      },
    });

    tenant.voiceMinutesUsed = 0;
    tenant.voiceUsagePeriodStart = currentMonthStart;
  }

  const limit = tenant.voiceMinutesLimit || 0;
  const used = tenant.voiceMinutesUsed || 0;

  const remaining = Math.max(0, limit - used);

  const utilizationPct =
    limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : 0;

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
  };
}

export async function incrementVoiceUsage(
  tenantId: string,
  minutesToAdd: number
) {
  const usage = await getTenantVoiceUsage(tenantId);

  if (!usage.enabled) {
    return {
      ok: false,
      reason: 'VOICE_DISABLED',
    };
  }

  if (usage.usedMinutes + minutesToAdd > usage.limitMinutes) {
    return {
      ok: false,
      reason: 'VOICE_LIMIT_REACHED',
    };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      voiceMinutesUsed: {
        increment: minutesToAdd,
      },
    },
  });

  return {
    ok: true,
  };
}