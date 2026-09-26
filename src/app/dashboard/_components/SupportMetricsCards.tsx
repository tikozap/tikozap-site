// src/app/dashboard/_components/SupportMetricsCards.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type SupportMetricsPayload = {
  ok: true;
  window: '24h' | '7d' | '30d';
  metrics: {
    startedAt: string;
    totalEvents: number;
counters: {
  answered: number;
  needsHumanFallback: number;
  rateLimited: number;

  openNow: number;
  waitingHuman: number;
  aiPaused: number;

  intents: Record<string, number>;
};
  };
};

type ActivationStatusPayload = {
  ok: true;
  window: '24h' | '7d' | '30d';
  status: {
    completedCount: number;
    totalCount: number;
    completionPct: number;
    isComplete: boolean;
  };
  funnel: {
    startedAt: string;
    totalEvents: number;
    baselineCount: number;
    steps: Array<{
      id: string;
      label: string;
      count: number;
      conversionPct: number;
    }>;
  };
};

const WINDOW_OPTIONS = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const;

function prettyIntent(intent: string): string {
  if (intent === 'order_status') return 'Order status';
  if (intent === 'needs_human_fallback') return 'Needs human';
  if (intent === 'unknown') return 'Unknown';
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export default function SupportMetricsCards() {
  const [windowKey, setWindowKey] = useState<SupportMetricsPayload['window']>('24h');
  const [metrics, setMetrics] = useState<SupportMetricsPayload['metrics'] | null>(null);
  const [error, setError] = useState('');
  const [activationData, setActivationData] = useState<ActivationStatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError('');
        setMetrics(null);
        setActivationData(null);

const [supportRes, activationRes] = await Promise.all([
  fetch(`/api/metrics/support?window=${windowKey}`, { cache: 'no-store' }),
  fetch(`/api/onboarding/activation?window=${windowKey}`, { cache: 'no-store' }),
]);

        const supportData = await supportRes.json().catch(() => null);
        if (!supportRes.ok || !supportData?.ok) {
          throw new Error(supportData?.error || `Request failed (${supportRes.status})`);
        }
        if (!cancelled) setMetrics(supportData.metrics);

        const activationData = await activationRes.json().catch(() => null);
        if (
          activationRes.ok &&
          activationData?.ok &&
          activationData?.status &&
          activationData?.funnel &&
          !cancelled
        ) {
          setActivationData(activationData as ActivationStatusPayload);
        }

      } catch {
        if (!cancelled) setError('Metrics unavailable right now.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [windowKey]);

  const intentRows = useMemo(() => {
    if (!metrics) return [];
    const rows = Object.entries(metrics.counters.intents).sort((a: any, b: any) => b[1] - a[1]);
    return rows.slice(0, 5);
  }, [metrics]);

  const activationFunnelSteps = useMemo(() => {
    if (!activationData?.funnel?.steps) return [];
    return activationData.funnel.steps;
  }, [activationData]);

  return (
    <>
      <div className="db-card db-tile" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h3>Support metrics</h3>
          <p>Windowed metrics from durable event storage.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          Time range
          <select
            className="db-btn"
            value={windowKey}
            onChange={(e) => setWindowKey(e.target.value as SupportMetricsPayload['window'])}
          >
            {WINDOW_OPTIONS.map((w: any) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>

<div className="db-metricsGrid">
  <div className="db-metricCard">
    <div className="db-metricLabel">Open now</div>

    <div className="db-metricValue">
      {metrics ? metrics.counters.openNow : '…'}
    </div>

    <div className="db-metricSub">
      active conversations
    </div>
  </div>

  <div className="db-metricCard">
    <div className="db-metricLabel">Waiting human</div>

    <div className="db-metricValue">
      {metrics ? metrics.counters.waitingHuman : '…'}
    </div>

    <div className="db-metricSub">
      needs attention
    </div>
  </div>

  <div className="db-metricCard">
    <div className="db-metricLabel">AI resolved</div>

    <div className="db-metricValue">
      {metrics ? metrics.counters.answered : '…'}
    </div>

    <div className="db-metricSub">
      closed by AI
    </div>
  </div>

  <div className="db-metricCard">
    <div className="db-metricLabel">AI paused</div>

    <div className="db-metricValue">
      {metrics ? metrics.counters.aiPaused : '…'}
    </div>

    <div className="db-metricSub">
      manual takeover
    </div>
  </div>

</div>

  <div className="db-funnelCard">
  <h3>Setup progress</h3>

  {!activationData ? (
    <p>Loading…</p>
  ) : activationFunnelSteps.length === 0 ? (
    <p>No setup progress yet. Complete onboarding steps to populate this.</p>
  ) : (
    <div className="db-funnelList">
      {activationFunnelSteps.map((step: any) => (
        <div key={step.id} className="db-funnelRow">
          <div className="db-funnelLabel">
            <span>{step.label}</span>
            <span>{step.conversionPct}%</span>
          </div>

          <div className="db-funnelBar">
            <div
              className="db-funnelFill"
              style={{ width: `${step.conversionPct}%` }}
            />
          </div>
        </div>
      ))}

      <p className="db-funnelSub">
        Time range: {windowKey}. Baseline events: {activationData.funnel.baselineCount}.
      </p>
    </div>
  )}
</div>
    </>
  );
}