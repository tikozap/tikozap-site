import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { getSupportMetrics } from '@/lib/metrics';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const metrics = getSupportMetrics(auth.tenant.id);
  return NextResponse.json({ ok: true, metrics });
}
