//src/app/api/billing/plan/route.ts

import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { normalizeBillingPlan, setTenantBillingPlan } from '@/lib/billingUsage';
import { trackMetric } from '@/lib/metrics';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  if (auth.tenant.role !== 'owner') {
  return NextResponse.json(
    {
      ok: false,
      error: 'Owner access required.',
    },
    {
      status: 403,
    }
  );
}

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
