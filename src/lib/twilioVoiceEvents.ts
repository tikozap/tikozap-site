import 'server-only';

import { prisma } from '@/lib/prisma';

type TwilioVoiceMetricSnapshot = {
  mos?: number;
  jitterMs?: number;
  packetLossPct?: number;
  roundTripMs?: number;
};

export type TwilioVoiceSummary = {
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
  thresholds: {
    mosWarning: number;
    mosCritical: number;
    jitterMsMax: number;
    packetLossPctMax: number;
    roundTripMsMax: number;
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
  }>;
};

type ExtractedTwilioVoiceEvent = {
  eventType: string;
  callSid?: string;
  accountSid?: string;
  streamSid?: string;
  tenantIdHint?: string;
  tenantSlugHint?: string;
  metrics: TwilioVoiceMetricSnapshot;
};

function normalizeKey(input: string): string {
  return (input || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeKeys(candidates: string[]): string[] {
  return candidates.map(normalizeKey);
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  if (!cleaned) return undefined;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function collectByKey(
  input: unknown,
  out: Map<string, unknown[]> = new Map<string, unknown[]>(),
  depth = 0,
): Map<string, unknown[]> {
  if (depth > 8 || input == null) return out;

  if (Array.isArray(input)) {
    for (const item of input) collectByKey(item, out, depth + 1);
    return out;
  }

  if (typeof input !== 'object') return out;

  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const nk = normalizeKey(k);
    const prev = out.get(nk) ?? [];
    prev.push(v);
    out.set(nk, prev);
    collectByKey(v, out, depth + 1);
  }

  return out;
}

function firstString(map: Map<string, unknown[]>, keyCandidates: string[]): string | undefined {
  const normalized = normalizeKeys(keyCandidates);
  for (const key of normalized) {
    const values = map.get(key) ?? [];
    for (const v of values) {
      const s = toNonEmptyString(v);
      if (s) return s;
    }
  }
  return undefined;
}

function firstNumber(map: Map<string, unknown[]>, keyCandidates: string[]): number | undefined {
  const normalized = normalizeKeys(keyCandidates);
  for (const key of normalized) {
    const values = map.get(key) ?? [];
    for (const v of values) {
      const n = toNumber(v);
      if (typeof n === 'number') return n;
    }
  }
  return undefined;
}

export function extractTwilioVoiceEvent(payload: unknown): ExtractedTwilioVoiceEvent {
  const map = collectByKey(payload);

  const eventType =
    firstString(map, ['event_type', 'eventType', 'event', 'type', 'name']) ||
    'voice_event';

  const callSid = firstString(map, ['call_sid', 'CallSid', 'callSid', 'callsid']);
  const accountSid = firstString(map, ['account_sid', 'AccountSid', 'accountSid', 'accountsid']);
  const streamSid = firstString(map, ['stream_sid', 'streamSid', 'streamsid']);
  const tenantIdHint = firstString(map, ['tenantId', 'tenant_id', 'tenantid']);
  const tenantSlugHint = firstString(map, ['tenantSlug', 'tenant_slug', 'tenantslug']);

  const mos = firstNumber(map, [
    'mos',
    'mean_opinion_score',
    'meanopinionscore',
    'voice_quality_mos',
    'voicequalitymos',
  ]);
  const jitterMs = firstNumber(map, [
    'jitter_ms',
    'jitterMs',
    'jitter',
    'average_jitter_ms',
    'avg_jitter_ms',
  ]);
  const packetLossPct = firstNumber(map, [
    'packet_loss_pct',
    'packetLossPct',
    'packetlosspct',
    'packet_loss_percent',
    'packetlosspercent',
    'packet_loss_percentage',
  ]);
  const roundTripMs = firstNumber(map, [
    'round_trip_ms',
    'roundTripMs',
    'rtt_ms',
    'rtt',
    'latency_ms',
    'latency',
  ]);

  return {
    eventType,
    callSid,
    accountSid,
    streamSid,
    tenantIdHint,
    tenantSlugHint,
    metrics: {
      mos,
      jitterMs,
      packetLossPct,
      roundTripMs,
    },
  };
}

async function resolveTenantId(opts: {
  tenantIdHint?: string;
  tenantSlugHint?: string;
}): Promise<string | undefined> {
  if (opts.tenantIdHint) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: opts.tenantIdHint },
      select: { id: true },
    });
    if (tenant?.id) return tenant.id;
  }

  if (opts.tenantSlugHint) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: opts.tenantSlugHint },
      select: { id: true },
    });
    if (tenant?.id) return tenant.id;
  }

  return undefined;
}

function avg(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (!nums.length) return null;
  const total = nums.reduce((acc, v) => acc + v, 0);
  return Number((total / nums.length).toFixed(3));
}

function grade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

function clamp(num: number): number {
  return Math.max(0, Math.min(100, Math.round(num)));
}

function envNum(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function alertThresholds() {
  return {
    mosWarning: envNum('TWILIO_ALERT_MOS_WARNING', 3.8),
    mosCritical: envNum('TWILIO_ALERT_MOS_CRITICAL', 3.5),
    jitterMsMax: envNum('TWILIO_ALERT_JITTER_MS_MAX', 30),
    packetLossPctMax: envNum('TWILIO_ALERT_PACKET_LOSS_PCT_MAX', 1.5),
    roundTripMsMax: envNum('TWILIO_ALERT_ROUND_TRIP_MS_MAX', 260),
  };
}

export async function ingestTwilioVoiceEvent(args: {
  payload: unknown;
  rawPayload: string;
  verification: string;
  tenantIdHint?: string;
  tenantSlugHint?: string;
}) {
  const extracted = extractTwilioVoiceEvent(args.payload);
  const tenantId = await resolveTenantId({
    tenantIdHint: args.tenantIdHint ?? extracted.tenantIdHint,
    tenantSlugHint: args.tenantSlugHint ?? extracted.tenantSlugHint,
  });

  const event = await prisma.twilioVoiceEvent.create({
    data: {
      tenantId: tenantId ?? null,
      eventType: extracted.eventType,
      verification: args.verification,
      callSid: extracted.callSid ?? null,
      accountSid: extracted.accountSid ?? null,
      streamSid: extracted.streamSid ?? null,
      mos: extracted.metrics.mos ?? null,
      jitterMs: extracted.metrics.jitterMs ?? null,
      packetLossPct: extracted.metrics.packetLossPct ?? null,
      roundTripMs: extracted.metrics.roundTripMs ?? null,
      rawPayload: args.rawPayload,
    },
    select: {
      id: true,
      tenantId: true,
      eventType: true,
      callSid: true,
      mos: true,
      jitterMs: true,
      packetLossPct: true,
      roundTripMs: true,
      createdAt: true,
      verification: true,
    },
  });

  return {
    event,
    extracted,
  };
}

export async function getLatestTwilioMetricsForCallSid(opts: {
  callSid: string;
  tenantId?: string;
}): Promise<TwilioVoiceMetricSnapshot | null> {
  const callSid = (opts.callSid || '').trim();
  if (!callSid) return null;

  const row = await prisma.twilioVoiceEvent.findFirst({
    where: {
      callSid,
      ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
      OR: [
        { mos: { not: null } },
        { jitterMs: { not: null } },
        { packetLossPct: { not: null } },
        { roundTripMs: { not: null } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      mos: true,
      jitterMs: true,
      packetLossPct: true,
      roundTripMs: true,
    },
  });

  if (!row) return null;
  return {
    mos: row.mos ?? undefined,
    jitterMs: row.jitterMs ?? undefined,
    packetLossPct: row.packetLossPct ?? undefined,
    roundTripMs: row.roundTripMs ?? undefined,
  };
}

export async function getTwilioVoiceSummary(opts: {
  tenantId: string;
  since?: Date;
  callSid?: string;
}): Promise<TwilioVoiceSummary> {
  const thresholds = alertThresholds();
  const where = {
    tenantId: opts.tenantId,
    ...(opts.since ? { createdAt: { gte: opts.since } } : {}),
    ...(opts.callSid ? { callSid: opts.callSid } : {}),
  };

  const rows = await prisma.twilioVoiceEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      eventType: true,
      callSid: true,
      verification: true,
      mos: true,
      jitterMs: true,
      packetLossPct: true,
      roundTripMs: true,
      createdAt: true,
    },
    take: 500,
  });

  const withMetrics = rows.filter(
    (r) =>
      r.mos != null ||
      r.jitterMs != null ||
      r.packetLossPct != null ||
      r.roundTripMs != null,
  );

  const avgMos = avg(withMetrics.map((r) => r.mos));
  const avgJitter = avg(withMetrics.map((r) => r.jitterMs));
  const avgPacketLoss = avg(withMetrics.map((r) => r.packetLossPct));
  const avgRoundTrip = avg(withMetrics.map((r) => r.roundTripMs));

  const degraded = {
    lowMos: withMetrics.filter((r) => typeof r.mos === 'number' && r.mos < 3.5).length,
    highJitter: withMetrics.filter((r) => typeof r.jitterMs === 'number' && r.jitterMs > 30)
      .length,
    highPacketLoss: withMetrics.filter(
      (r) => typeof r.packetLossPct === 'number' && r.packetLossPct > 1.5,
    ).length,
    highRoundTrip: withMetrics.filter(
      (r) => typeof r.roundTripMs === 'number' && r.roundTripMs > 260,
    ).length,
  };

  const healthReasons: string[] = [];
  let healthScore: number | null = null;
  if (withMetrics.length) {
    let score = 88;
    if (avgMos != null) {
      if (avgMos < 3.5) {
        score -= 24;
        healthReasons.push(`Average MOS is low (${avgMos.toFixed(2)}).`);
      } else if (avgMos < 4.0) {
        score -= 10;
        healthReasons.push(`Average MOS is fair (${avgMos.toFixed(2)}).`);
      }
    }
    if (avgJitter != null && avgJitter > 30) {
      score -= 10;
      healthReasons.push(`Average jitter is high (${Math.round(avgJitter)}ms).`);
    }
    if (avgPacketLoss != null && avgPacketLoss > 1.5) {
      score -= 14;
      healthReasons.push(`Average packet loss is high (${avgPacketLoss.toFixed(2)}%).`);
    }
    if (avgRoundTrip != null && avgRoundTrip > 260) {
      score -= 8;
      healthReasons.push(`Average round trip is high (${Math.round(avgRoundTrip)}ms).`);
    }

    const degradedRatio =
      (degraded.lowMos +
        degraded.highJitter +
        degraded.highPacketLoss +
        degraded.highRoundTrip) /
      Math.max(withMetrics.length, 1);
    if (degradedRatio > 0.5) score -= 8;
    if (degradedRatio > 0.8) score -= 8;

    healthScore = clamp(score);
    if (!healthReasons.length) {
      healthReasons.push('Voice transport signals are within healthy thresholds.');
    }
  }

  const startedAt = rows[rows.length - 1]?.createdAt ?? opts.since ?? new Date();
  const latest = rows[0]
    ? {
        createdAt: rows[0].createdAt.toISOString(),
        eventType: rows[0].eventType,
        callSid: rows[0].callSid,
        verification: rows[0].verification,
      }
    : null;

  const alerts: TwilioVoiceSummary['alerts'] = [];
  if (!withMetrics.length) {
    alerts.push({
      id: 'no_voice_metrics',
      severity: 'info',
      message: 'No Twilio voice quality metrics detected in this window.',
    });
  } else {
    if (avgMos != null && avgMos < thresholds.mosWarning) {
      alerts.push({
        id: 'low_mos',
        severity: avgMos < thresholds.mosCritical ? 'critical' : 'warning',
        message: `Average MOS (${avgMos.toFixed(2)}) is below threshold.`,
        metric: 'mos',
        value: Number(avgMos.toFixed(2)),
        threshold:
          avgMos < thresholds.mosCritical
            ? thresholds.mosCritical
            : thresholds.mosWarning,
      });
    }

    if (avgJitter != null && avgJitter > thresholds.jitterMsMax) {
      alerts.push({
        id: 'high_jitter',
        severity:
          avgJitter > thresholds.jitterMsMax * 1.5 ? 'critical' : 'warning',
        message: `Average jitter (${Math.round(avgJitter)}ms) is above threshold.`,
        metric: 'jitterMs',
        value: Math.round(avgJitter),
        threshold: thresholds.jitterMsMax,
      });
    }

    if (avgPacketLoss != null && avgPacketLoss > thresholds.packetLossPctMax) {
      alerts.push({
        id: 'high_packet_loss',
        severity:
          avgPacketLoss > thresholds.packetLossPctMax * 1.5
            ? 'critical'
            : 'warning',
        message: `Average packet loss (${avgPacketLoss.toFixed(2)}%) is above threshold.`,
        metric: 'packetLossPct',
        value: Number(avgPacketLoss.toFixed(2)),
        threshold: thresholds.packetLossPctMax,
      });
    }

    if (avgRoundTrip != null && avgRoundTrip > thresholds.roundTripMsMax) {
      alerts.push({
        id: 'high_round_trip',
        severity:
          avgRoundTrip > thresholds.roundTripMsMax * 1.5 ? 'critical' : 'warning',
        message: `Average round trip (${Math.round(avgRoundTrip)}ms) is above threshold.`,
        metric: 'roundTripMs',
        value: Math.round(avgRoundTrip),
        threshold: thresholds.roundTripMsMax,
      });
    }
  }

  return {
    startedAt: startedAt.toISOString(),
    totalEvents: rows.length,
    withQualityMetrics: withMetrics.length,
    latest,
    averages: {
      mos: avgMos,
      jitterMs: avgJitter,
      packetLossPct: avgPacketLoss,
      roundTripMs: avgRoundTrip,
    },
    degraded,
    health: {
      score: healthScore,
      grade: healthScore == null ? null : grade(healthScore),
      reasons: healthReasons,
    },
    thresholds,
    alerts,
  };
}
