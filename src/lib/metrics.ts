import 'server-only';
import { prisma } from '@/lib/prisma';

type MetricEvent = {
  source: string;
  event: string;
  tenantId?: string;
  intent?: string;
  [key: string]: unknown;
};

type SupportCounters = {
  answered: number;
  needsHumanFallback: number;
  rateLimited: number;
  intents: Record<string, number>;
};

function emptyCounters(): SupportCounters {
  return {
    answered: 0,
    needsHumanFallback: 0,
    rateLimited: 0,
    intents: {},
  };
}

export async function trackMetric(event: MetricEvent) {
  // Keep structured logs for fast debugging.
  console.info('[metric]', JSON.stringify(event));
  try {
    await prisma.metricEvent.create({
      data: {
        tenantId: event.tenantId || null,
        source: event.source,
        event: event.event,
        intent: event.intent || null,
      },
    });
  } catch (err) {
    console.error('[metric] failed to persist event', err);
  }
}

export async function getSupportMetrics(opts: { tenantId?: string; since?: Date }) {
  const where = {
    ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
    ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
  };

  const rows = await prisma.metricEvent.findMany({
    where,
    select: { event: true, intent: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const counters = emptyCounters();
  for (const row of rows) {
    if (row.event === 'answered') counters.answered += 1;
    if (row.event === 'needs_human_fallback') counters.needsHumanFallback += 1;
    if (row.event === 'rate_limited') counters.rateLimited += 1;

    if ((row.event === 'answered' || row.event === 'needs_human_fallback') && row.intent) {
      counters.intents[row.intent] = (counters.intents[row.intent] ?? 0) + 1;
    }
  }

  const startedAt = rows[0]?.createdAt ?? opts.since ?? new Date();

  return {
    startedAt: startedAt.toISOString(),
    totalEvents: rows.length,
    counters: {
      ...counters,
    },
  };
}
