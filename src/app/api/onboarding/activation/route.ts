import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { trackMetric } from '@/lib/metrics';
import {
  ACTIVATION_WINDOW_MS,
  type ActivationWindowKey,
  ALLOWED_ACTIVATION_EVENTS,
  getActivationFunnel,
  getActivationStatus,
} from '@/lib/onboardingActivation';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const rawWindow = url.searchParams.get('window') || '7d';
  const windowKey: ActivationWindowKey =
    rawWindow in ACTIVATION_WINDOW_MS ? (rawWindow as ActivationWindowKey) : '7d';
  const since = new Date(Date.now() - ACTIVATION_WINDOW_MS[windowKey]);

  const status = await getActivationStatus(auth.tenant.id);
  const funnel = await getActivationFunnel({
    tenantId: auth.tenant.id,
    since,
  });
  return NextResponse.json({ ok: true, window: windowKey, status, funnel });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body: any = await req.json().catch(() => ({}));
  const event = typeof body?.event === 'string' ? body.event.trim() : '';

  if (!event || !ALLOWED_ACTIVATION_EVENTS.has(event)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid activation event.' },
      { status: 400 },
    );
  }

  await trackMetric({
    source: 'onboarding',
    event,
    tenantId: auth.tenant.id,
  });

  const status = await getActivationStatus(auth.tenant.id);
  return NextResponse.json({ ok: true, status });
}
