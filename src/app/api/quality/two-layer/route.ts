import { NextResponse } from 'next/server';
import { trackMetric } from '@/lib/metrics';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import {
  evaluateTwoLayerQuality,
  type DemoReplySource,
  type DemoReplySignals,
  type QualityTransportInput,
} from '@/lib/twoLayerQuality';
import { getLatestTwilioMetricsForCallSid } from '@/lib/twilioVoiceEvents';

export const runtime = 'nodejs';

function normalizeSource(input: unknown): DemoReplySource {
  if (input === 'model' || input === 'rule' || input === 'canned') return input;
  return 'canned';
}

function normalizeSignals(input: unknown): DemoReplySignals | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const v = input as Record<string, unknown>;
  return {
    mentionsStarterLink: v.mentionsStarterLink === true,
    mentionsHandoff: v.mentionsHandoff === true,
    mentionsSafePreview: v.mentionsSafePreview === true,
    mentionsSetupPath: v.mentionsSetupPath === true,
  };
}

function n(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return value;
}

function s(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeTransport(input: unknown): QualityTransportInput {
  if (!input || typeof input !== 'object') return {};
  const v = input as Record<string, unknown>;
  const twilioRaw = v.twilio && typeof v.twilio === 'object' ? (v.twilio as Record<string, unknown>) : null;
  return {
    firstTokenMs: n(v.firstTokenMs),
    totalResponseMs: n(v.totalResponseMs),
    usedSse: v.usedSse === true,
    fallbackUsed: v.fallbackUsed === true,
    twilio: twilioRaw
      ? {
          mos: n(twilioRaw.mos),
          jitterMs: n(twilioRaw.jitterMs),
          packetLossPct: n(twilioRaw.packetLossPct),
          roundTripMs: n(twilioRaw.roundTripMs),
        }
      : undefined,
  };
}

export async function POST(req: Request) {
  const rate = checkRateLimit(req, {
    namespace: 'quality-two-layer',
    limit: 100,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many quality evaluation requests.' },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  const body: any = await req.json().catch(() => ({}));
  const transportRaw =
    body.transport && typeof body.transport === 'object'
      ? (body.transport as Record<string, unknown>)
      : {};
  const conversationRaw =
    body.conversation && typeof body.conversation === 'object'
      ? (body.conversation as Record<string, unknown>)
      : {};
  const callSid =
    s(body.callSid) || s(transportRaw.callSid) || s(conversationRaw.callSid);

  let transport = normalizeTransport(transportRaw);
  let twilioLinked = false;
  if (!transport.twilio && callSid) {
    const linked = await getLatestTwilioMetricsForCallSid({ callSid });
    if (linked) {
      transport = {
        ...transport,
        twilio: linked,
      };
      twilioLinked = true;
    }
  }

  const report = evaluateTwoLayerQuality({
    transport,
    conversation: {
      source: normalizeSource(conversationRaw.source),
      signals: normalizeSignals(conversationRaw.signals),
      userTurns: n(conversationRaw.userTurns),
    },
  });

  await trackMetric({ source: 'quality-two-layer', event: 'evaluated' });
  if (twilioLinked) {
    await trackMetric({ source: 'quality-two-layer', event: 'linked_twilio_metrics' });
  }
  if (report.scores.transport < 70) {
    await trackMetric({ source: 'quality-two-layer', event: 'transport_low' });
  }
  if (report.scores.conversation < 70) {
    await trackMetric({ source: 'quality-two-layer', event: 'conversation_low' });
  }

  return NextResponse.json({
    ok: true,
    report,
    twilioLinked,
  });
}
