import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { getTwilioVoiceSummary } from '@/lib/twilioVoiceEvents';

export const runtime = 'nodejs';

const WINDOW_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
} as const;

type WindowKey = keyof typeof WINDOW_MS;

export async function GET(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const rawWindow = url.searchParams.get('window') || '24h';
  const windowKey: WindowKey =
    rawWindow in WINDOW_MS ? (rawWindow as WindowKey) : '24h';

  const since = new Date(Date.now() - WINDOW_MS[windowKey]);
  const callSid = (url.searchParams.get('callSid') || '').trim() || undefined;

  const summary = await getTwilioVoiceSummary({
    tenantId: auth.tenant.id,
    since,
    callSid,
  });

  return NextResponse.json({
    ok: true,
    window: windowKey,
    summary,
  });
}
