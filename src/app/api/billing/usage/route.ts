import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { getTenantBillingUsage } from '@/lib/billingUsage';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const usage = await getTenantBillingUsage(auth.tenant.id);
  return NextResponse.json({ ok: true, usage });
}
