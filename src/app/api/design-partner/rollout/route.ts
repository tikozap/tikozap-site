import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { trackMetric } from '@/lib/metrics';
import {
  getDesignPartnerRolloutStatus,
  updateDesignPartnerRolloutItem,
} from '@/lib/designPartnerRollout';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const status = await getDesignPartnerRolloutStatus(auth.tenant.id);
  return NextResponse.json({ ok: true, status });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body: any = await req.json().catch(() => ({}));
  const itemId = typeof body?.itemId === 'string' ? body.itemId.trim() : '';
  if (!itemId) {
    return NextResponse.json({ ok: false, error: 'Missing itemId.' }, { status: 400 });
  }

  const status = await updateDesignPartnerRolloutItem({
    tenantId: auth.tenant.id,
    itemId,
    done: typeof body?.done === 'boolean' ? body.done : undefined,
    owner: body?.owner,
    notes: body?.notes,
  });

  await trackMetric({
    source: 'design-partner-rollout',
    event: 'item_updated',
    tenantId: auth.tenant.id,
  });

  return NextResponse.json({ ok: true, status });
}
