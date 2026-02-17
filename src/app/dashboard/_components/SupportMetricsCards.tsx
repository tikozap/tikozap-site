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
      intents: Record<string, number>;
    };
  };
};

type TwilioSummaryPayload = {
  ok: true;
  window: '24h' | '7d' | '30d';
  summary: {
    startedAt: string;
    totalEvents: number;
    withQualityMetrics: number;
    latest: {
      createdAt: string;
      eventType: string;
      callSid: string | null;
      verification: string;
    } | null;
    averages: {
      mos: number | null;
      jitterMs: number | null;
      packetLossPct: number | null;
      roundTripMs: number | null;
    };
    degraded: {
      lowMos: number;
      highJitter: number;
      highPacketLoss: number;
      highRoundTrip: number;
    };
    health: {
      score: number | null;
      grade: 'A' | 'B' | 'C' | 'D' | null;
      reasons: string[];
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
  const [voiceSummary, setVoiceSummary] = useState<TwilioSummaryPayload['summary'] | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [activationData, setActivationData] = useState<ActivationStatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError('');
        setVoiceError('');
        setMetrics(null);
        setVoiceSummary(null);
        setActivationData(null);

        const [supportRes, voiceRes, activationRes] = await Promise.all([
          fetch(`/api/metrics/support?window=${windowKey}`, { cache: 'no-store' }),
          fetch(`/api/quality/twilio/summary?window=${windowKey}`, { cache: 'no-store' }),
          fetch(`/api/onboarding/activation?window=${windowKey}`, { cache: 'no-store' }),
        ]);

        const supportData = await supportRes.json().catch(() => null);
        if (!supportRes.ok || !supportData?.ok) {
          throw new Error(supportData?.error || `Request failed (${supportRes.status})`);
        }
        if (!cancelled) setMetrics(supportData.metrics);

        const voiceData = await voiceRes.json().catch(() => null);
        if (!voiceRes.ok || !voiceData?.ok) {
          if (!cancelled) setVoiceError('Twilio voice quality unavailable.');
        } else if (!cancelled) {
          setVoiceSummary(voiceData.summary);
        }

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
    const rows = Object.entries(metrics.counters.intents).sort((a, b) => b[1] - a[1]);
    return rows.slice(0, 5);
  }, [metrics]);

  const voiceHealth = useMemo(() => {
    if (!voiceSummary) return 'Loading…';
    if (!voiceSummary.withQualityMetrics) return 'No voice telemetry yet';
    const grade = voiceSummary.health.grade || 'N/A';
    const score = voiceSummary.health.score != null ? `${voiceSummary.health.score}/100` : 'n/a';
    return `${grade} (${score})`;
  }, [voiceSummary]);

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
            {WINDOW_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>

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

      <div className="db-card db-tile">
        <h3>Twilio voice quality</h3>
        <p>{voiceError ? voiceError : voiceHealth}</p>
      </div>

      <div className="db-card db-tile">
        <h3>Degraded voice signals</h3>
        <p>
          {!voiceSummary
            ? 'Loading…'
            : `${voiceSummary.degraded.lowMos + voiceSummary.degraded.highJitter + voiceSummary.degraded.highPacketLoss + voiceSummary.degraded.highRoundTrip} events`}
        </p>
      </div>

      <div className="db-card db-tile">
        <h3>Onboarding activation</h3>
        <p>
          {!activationData?.status
            ? 'Loading…'
            : `${activationData.status.completedCount}/${activationData.status.totalCount} (${activationData.status.completionPct}%)`}
        </p>
      </div>

      <div className="db-card db-tile" style={{ gridColumn: '1 / -1' }}>
        <h3>Activation funnel</h3>
        {!activationData ? (
          <p>Loading…</p>
        ) : activationFunnelSteps.length === 0 ? (
          <p>No activation data yet. Go through onboarding steps to populate this.</p>
        ) : (
          <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
            {activationFunnelSteps.map((step) => (
              <div key={step.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span>{step.label}</span>
                  <span>
                    {step.count} events ({step.conversionPct}%)
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 999,
                    background: '#e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${step.conversionPct}%`,
                      background: '#111827',
                      borderRadius: 999,
                      transition: 'width 180ms ease',
                    }}
                  />
                </div>
              </div>
            ))}
            <p style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
              Window: {windowKey}. Baseline events: {activationData.funnel.baselineCount}.
            </p>
          </div>
        )}
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

      <div className="db-card db-tile" style={{ gridColumn: '1 / -1' }}>
        <h3>Voice transport snapshot</h3>
        {voiceError ? (
          <p>{voiceError}</p>
        ) : !voiceSummary ? (
          <p>Loading…</p>
        ) : !voiceSummary.withQualityMetrics ? (
          <p>No Twilio voice quality metrics yet. Send webhook events to populate this.</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <span className="db-pill">MOS: {voiceSummary.averages.mos?.toFixed(2) ?? '—'}</span>
            <span className="db-pill">Jitter: {voiceSummary.averages.jitterMs?.toFixed(1) ?? '—'}ms</span>
            <span className="db-pill">Packet loss: {voiceSummary.averages.packetLossPct?.toFixed(2) ?? '—'}%</span>
            <span className="db-pill">Round trip: {voiceSummary.averages.roundTripMs?.toFixed(0) ?? '—'}ms</span>
          </div>
        )}
      </div>
    </>
  );
}
