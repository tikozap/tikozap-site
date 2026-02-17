import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { trackMetric } from '@/lib/metrics';
import {
  ALLOWED_ACTIVATION_EVENTS,
  getActivationStatus,
} from '@/lib/onboardingActivation';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const status = await getActivationStatus(auth.tenant.id);
  return NextResponse.json({ ok: true, status });
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
