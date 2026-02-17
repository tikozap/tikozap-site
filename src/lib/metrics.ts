import 'server-only';

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

type MetricsStore = {
  startedAt: number;
  totalEvents: number;
  global: SupportCounters;
  perTenant: Map<string, SupportCounters>;
};

const globalForMetrics = globalThis as unknown as {
  __tzMetricsStore?: MetricsStore;
};

function emptyCounters(): SupportCounters {
  return {
    answered: 0,
    needsHumanFallback: 0,
    rateLimited: 0,
    intents: {},
  };
}

const store: MetricsStore =
  globalForMetrics.__tzMetricsStore ?? {
    startedAt: Date.now(),
    totalEvents: 0,
    global: emptyCounters(),
    perTenant: new Map<string, SupportCounters>(),
  };

if (!globalForMetrics.__tzMetricsStore) {
  globalForMetrics.__tzMetricsStore = store;
}

function applyEvent(counters: SupportCounters, event: MetricEvent) {
  if (event.event === 'answered') counters.answered += 1;
  if (event.event === 'needs_human_fallback') counters.needsHumanFallback += 1;
  if (event.event === 'rate_limited') counters.rateLimited += 1;

  if ((event.event === 'answered' || event.event === 'needs_human_fallback') && event.intent) {
    counters.intents[event.intent] = (counters.intents[event.intent] ?? 0) + 1;
  }
}

export function trackMetric(event: MetricEvent) {
  // Structured logs are the first step; this can be wired to a persistent analytics pipeline.
  console.info('[metric]', JSON.stringify(event));

  store.totalEvents += 1;
  applyEvent(store.global, event);

  if (event.tenantId) {
    const existing = store.perTenant.get(event.tenantId) ?? emptyCounters();
    applyEvent(existing, event);
    store.perTenant.set(event.tenantId, existing);
  }
}

export function getSupportMetrics(tenantId?: string) {
  const counters = tenantId ? store.perTenant.get(tenantId) ?? emptyCounters() : store.global;
  return {
    startedAt: new Date(store.startedAt).toISOString(),
    totalEvents: store.totalEvents,
    counters: {
      answered: counters.answered,
      needsHumanFallback: counters.needsHumanFallback,
      rateLimited: counters.rateLimited,
      intents: counters.intents,
    },
  };
}
