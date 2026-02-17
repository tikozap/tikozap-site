import 'server-only';

import { prisma } from '@/lib/prisma';
import { getTwilioVoiceSummary } from '@/lib/twilioVoiceEvents';
import { getActivationStatus } from '@/lib/onboardingActivation';
import { getTenantBillingUsage } from '@/lib/billingUsage';

export const CASE_STUDY_WINDOW_MS = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
} as const;

export type CaseStudyWindowKey = keyof typeof CASE_STUDY_WINDOW_MS;

export type CaseStudyMetrics = {
  window: CaseStudyWindowKey;
  startedAt: string;
  generatedAt: string;
  conversations: {
    total: number;
    unresolved: number;
    answeredEvents: number;
    needsHumanEvents: number;
    autoResolutionRatePct: number;
    needsHumanRatePct: number;
  };
  responsiveness: {
    sampleCount: number;
    firstResponseP50Seconds: number | null;
    firstResponseP90Seconds: number | null;
  };
  quality: {
    rateLimitedEvents: number;
    topIntents: Array<{ intent: string; count: number }>;
  };
  onboarding: {
    completionPct: number;
    completedCount: number;
    totalCount: number;
  };
  billing: {
    plan: string;
    monthlyLimit: number;
    usedConversations: number;
    utilizationPct: number;
  };
  voice: {
    healthScore: number | null;
    healthGrade: string | null;
    avgMos: number | null;
    avgJitterMs: number | null;
    avgPacketLossPct: number | null;
  };
};

function pct(num: number, den: number): number {
  if (!den) return 0;
  return Number(((num / den) * 100).toFixed(1));
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return Math.round(sorted[idx]);
}

function toCsvRow(key: string, value: string | number | null): string {
  const safeKey = `"${String(key).replace(/"/g, '""')}"`;
  const safeValue = `"${String(value ?? '').replace(/"/g, '""')}"`;
  return `${safeKey},${safeValue}`;
}

export function caseStudyMetricsToCsv(metrics: CaseStudyMetrics): string {
  const rows: Array<[string, string | number | null]> = [
    ['window', metrics.window],
    ['startedAt', metrics.startedAt],
    ['generatedAt', metrics.generatedAt],
    ['conversations.total', metrics.conversations.total],
    ['conversations.unresolved', metrics.conversations.unresolved],
    ['conversations.answeredEvents', metrics.conversations.answeredEvents],
    ['conversations.needsHumanEvents', metrics.conversations.needsHumanEvents],
    ['conversations.autoResolutionRatePct', metrics.conversations.autoResolutionRatePct],
    ['conversations.needsHumanRatePct', metrics.conversations.needsHumanRatePct],
    ['responsiveness.sampleCount', metrics.responsiveness.sampleCount],
    ['responsiveness.firstResponseP50Seconds', metrics.responsiveness.firstResponseP50Seconds],
    ['responsiveness.firstResponseP90Seconds', metrics.responsiveness.firstResponseP90Seconds],
    ['quality.rateLimitedEvents', metrics.quality.rateLimitedEvents],
    [
      'quality.topIntents',
      metrics.quality.topIntents.map((i) => `${i.intent}:${i.count}`).join(' | '),
    ],
    ['onboarding.completionPct', metrics.onboarding.completionPct],
    ['onboarding.completedCount', metrics.onboarding.completedCount],
    ['onboarding.totalCount', metrics.onboarding.totalCount],
    ['billing.plan', metrics.billing.plan],
    ['billing.monthlyLimit', metrics.billing.monthlyLimit],
    ['billing.usedConversations', metrics.billing.usedConversations],
    ['billing.utilizationPct', metrics.billing.utilizationPct],
    ['voice.healthScore', metrics.voice.healthScore],
    ['voice.healthGrade', metrics.voice.healthGrade],
    ['voice.avgMos', metrics.voice.avgMos],
    ['voice.avgJitterMs', metrics.voice.avgJitterMs],
    ['voice.avgPacketLossPct', metrics.voice.avgPacketLossPct],
  ];

  const lines = ['"metric","value"', ...rows.map(([k, v]) => toCsvRow(k, v))];
  return lines.join('\n');
}

export async function getCaseStudyMetrics(args: {
  tenantId: string;
  window: CaseStudyWindowKey;
}): Promise<CaseStudyMetrics> {
  const since = new Date(Date.now() - CASE_STUDY_WINDOW_MS[args.window]);

  const [conversations, metricEvents, activation, billing, voice] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        tenantId: args.tenantId,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        status: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, createdAt: true },
        },
      },
    }),
    prisma.metricEvent.findMany({
      where: {
        tenantId: args.tenantId,
        createdAt: { gte: since },
      },
      select: { event: true, intent: true },
    }),
    getActivationStatus(args.tenantId),
    getTenantBillingUsage(args.tenantId),
    getTwilioVoiceSummary({ tenantId: args.tenantId, since }),
  ]);

  const totalConversations = conversations.length;
  const unresolvedConversations = conversations.filter((c) => c.status !== 'closed').length;

  const firstResponseSeconds: number[] = [];
  for (const conversation of conversations) {
    const firstCustomer = conversation.messages.find((m) => m.role === 'customer');
    if (!firstCustomer) continue;
    const firstResponder = conversation.messages.find(
      (m) =>
        (m.role === 'assistant' || m.role === 'staff') &&
        m.createdAt.getTime() >= firstCustomer.createdAt.getTime(),
    );
    if (!firstResponder) continue;
    const seconds = Math.round(
      (firstResponder.createdAt.getTime() - firstCustomer.createdAt.getTime()) / 1000,
    );
    if (seconds >= 0) firstResponseSeconds.push(seconds);
  }

  let answeredEvents = 0;
  let needsHumanEvents = 0;
  let rateLimitedEvents = 0;
  const intentCounts: Record<string, number> = {};
  for (const event of metricEvents) {
    if (event.event === 'answered') answeredEvents += 1;
    if (event.event === 'needs_human_fallback') needsHumanEvents += 1;
    if (event.event === 'rate_limited') rateLimitedEvents += 1;
    if (event.intent && (event.event === 'answered' || event.event === 'needs_human_fallback')) {
      intentCounts[event.intent] = (intentCounts[event.intent] ?? 0) + 1;
    }
  }

  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([intent, count]) => ({ intent, count }));

  return {
    window: args.window,
    startedAt: since.toISOString(),
    generatedAt: new Date().toISOString(),
    conversations: {
      total: totalConversations,
      unresolved: unresolvedConversations,
      answeredEvents,
      needsHumanEvents,
      autoResolutionRatePct: pct(answeredEvents, Math.max(totalConversations, 1)),
      needsHumanRatePct: pct(needsHumanEvents, Math.max(totalConversations, 1)),
    },
    responsiveness: {
      sampleCount: firstResponseSeconds.length,
      firstResponseP50Seconds: percentile(firstResponseSeconds, 50),
      firstResponseP90Seconds: percentile(firstResponseSeconds, 90),
    },
    quality: {
      rateLimitedEvents,
      topIntents,
    },
    onboarding: {
      completionPct: activation.completionPct,
      completedCount: activation.completedCount,
      totalCount: activation.totalCount,
    },
    billing: {
      plan: billing.plan,
      monthlyLimit: billing.monthlyLimit,
      usedConversations: billing.usedConversations,
      utilizationPct: billing.utilizationPct,
    },
    voice: {
      healthScore: voice.health.score,
      healthGrade: voice.health.grade,
      avgMos: voice.averages.mos,
      avgJitterMs: voice.averages.jitterMs,
      avgPacketLossPct: voice.averages.packetLossPct,
    },
  };
}
