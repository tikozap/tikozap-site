'use client';

import { useEffect, useMemo, useState } from 'react';

type SupportMetricsPayload = {
  ok: true;
  metrics: {
    startedAt: string;
    totalEvents: number;
    counters: {
      answered: number;
      needsHumanFallback: number;
      rateLimited: number;
      intents: Record<string, number>;
    };
  };
};

function prettyIntent(intent: string): string {
  if (intent === 'order_status') return 'Order status';
  if (intent === 'needs_human_fallback') return 'Needs human';
  if (intent === 'unknown') return 'Unknown';
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export default function SupportMetricsCards() {
  const [metrics, setMetrics] = useState<SupportMetricsPayload['metrics'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/metrics/support', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        if (!cancelled) setMetrics(data.metrics);
      } catch {
        if (!cancelled) setError('Metrics unavailable right now.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const intentRows = useMemo(() => {
    if (!metrics) return [];
    const rows = Object.entries(metrics.counters.intents).sort((a, b) => b[1] - a[1]);
    return rows.slice(0, 5);
  }, [metrics]);

  return (
    <>
      <div className="db-card db-tile">
        <h3>Needs-human fallback</h3>
        <p>{metrics ? `${metrics.counters.needsHumanFallback} conversations` : 'Loading…'}</p>
      </div>

      <div className="db-card db-tile">
        <h3>Auto-answered</h3>
        <p>{metrics ? `${metrics.counters.answered} conversations` : 'Loading…'}</p>
      </div>

      <div className="db-card db-tile">
        <h3>Rate-limit events</h3>
        <p>{metrics ? `${metrics.counters.rateLimited} events` : 'Loading…'}</p>
      </div>

      <div className="db-card db-tile" style={{ gridColumn: '1 / -1' }}>
        <h3>Reply intent mix</h3>
        {error ? (
          <p>{error}</p>
        ) : !metrics ? (
          <p>Loading…</p>
        ) : intentRows.length === 0 ? (
          <p>No intent data yet. Send a few test messages to populate this.</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {intentRows.map(([intent, count]) => (
              <span key={intent} className="db-pill">
                {prettyIntent(intent)}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
