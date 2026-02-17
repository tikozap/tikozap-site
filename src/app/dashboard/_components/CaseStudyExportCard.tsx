'use client';

import { useEffect, useMemo, useState } from 'react';

type CaseStudyWindow = '7d' | '30d' | '90d';

type CaseStudyPayload = {
  ok: true;
  window: CaseStudyWindow;
  metrics: {
    conversations: {
      total: number;
      unresolved: number;
      autoResolutionRatePct: number;
      needsHumanRatePct: number;
    };
    responsiveness: {
      sampleCount: number;
      firstResponseP50Seconds: number | null;
      firstResponseP90Seconds: number | null;
    };
    onboarding: {
      completionPct: number;
    };
    billing: {
      plan: string;
      utilizationPct: number;
    };
    voice: {
      healthGrade: string | null;
    };
  };
};

const WINDOW_OPTIONS: Array<{ value: CaseStudyWindow; label: string }> = [
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
  { value: '90d', label: 'Last 90d' },
];

export default function CaseStudyExportCard() {
  const [windowKey, setWindowKey] = useState<CaseStudyWindow>('30d');
  const [metrics, setMetrics] = useState<CaseStudyPayload['metrics'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError('');
        setMetrics(null);
        const res = await fetch(`/api/metrics/case-study/export?window=${windowKey}`, {
          cache: 'no-store',
        });
        const data = (await res.json().catch(() => null)) as CaseStudyPayload | null;
        if (!res.ok || !data?.ok || !data?.metrics) {
          throw new Error('Export metrics unavailable.');
        }
        if (!cancelled) setMetrics(data.metrics);
      } catch {
        if (!cancelled) setError('Case-study metrics unavailable right now.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [windowKey]);

  const exportLinks = useMemo(
    () => ({
      json: `/api/metrics/case-study/export?window=${windowKey}&format=json`,
      csv: `/api/metrics/case-study/export?window=${windowKey}&format=csv`,
    }),
    [windowKey],
  );

  return (
    <div className="db-card db-tile" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h3>Case-study export</h3>
          <p>KPI snapshot for partner updates and proof-of-value reporting.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          Window
          <select
            className="db-btn"
            value={windowKey}
            onChange={(e) => setWindowKey(e.target.value as CaseStudyWindow)}
          >
            {WINDOW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p style={{ marginTop: 8, color: '#b91c1c' }}>{error}</p>
      ) : !metrics ? (
        <p style={{ marginTop: 8 }}>Loading…</p>
      ) : (
        <div style={{ marginTop: 10, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="db-pill">Conversations: {metrics.conversations.total}</div>
          <div className="db-pill">Auto-resolution: {metrics.conversations.autoResolutionRatePct}%</div>
          <div className="db-pill">
            P50 first response: {metrics.responsiveness.firstResponseP50Seconds ?? 'n/a'}s
          </div>
          <div className="db-pill">Needs-human: {metrics.conversations.needsHumanRatePct}%</div>
          <div className="db-pill">Onboarding: {metrics.onboarding.completionPct}%</div>
          <div className="db-pill">Plan: {metrics.billing.plan}</div>
          <div className="db-pill">Plan utilization: {metrics.billing.utilizationPct}%</div>
          <div className="db-pill">Voice grade: {metrics.voice.healthGrade ?? 'n/a'}</div>
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className="db-btn" href={exportLinks.json} target="_blank" rel="noreferrer">
          Open JSON export
        </a>
        <a className="db-btn" href={exportLinks.csv} target="_blank" rel="noreferrer">
          Download CSV export
        </a>
      </div>
    </div>
  );
}
