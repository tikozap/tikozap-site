import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { normalizeBillingPlan, setTenantBillingPlan } from '@/lib/billingUsage';
import { trackMetric } from '@/lib/metrics';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body: any = await req.json().catch(() => ({}));
  const rawPlan = typeof body?.plan === 'string' ? body.plan : '';
  const plan = normalizeBillingPlan(rawPlan);

  const usage = await setTenantBillingPlan(auth.tenant.id, plan);
  await trackMetric({
    source: 'billing',
    event: 'plan_changed',
    tenantId: auth.tenant.id,
    plan,
  });

  return NextResponse.json({ ok: true, usage });
}
