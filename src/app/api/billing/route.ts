// src/app/api/billing/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PlanTier = z.enum(['STARTER', 'PRO', 'BUSINESS']);

const Body = z
  .object({
    plan: PlanTier.optional(),
    startTrial: z.boolean().optional(),
  })
  .refine((v) => v.plan || v.startTrial, { message: 'Missing action' });

const selectTenant = {
  id: true,
  storeName: true,
  plan: true,
  billingStatus: true,
  trialEndsAt: true,
} as const;

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export async function GET() {
  const authed = await getAuthedUserAndTenant();
  const tenantId = authed?.tenant?.id;
  if (!tenantId) return json({ ok: false, error: 'Unauthorized' }, 401);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: selectTenant,
  });

  if (!tenant) return json({ ok: false, error: 'Tenant not found' }, 404);
  return json({ ok: true, tenant });
}

export async function POST(req: Request) {
  const authed = await getAuthedUserAndTenant();
  const tenantId = authed?.tenant?.id;
  if (!tenantId) return json({ ok: false, error: 'Unauthorized' }, 401);

  const raw = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: parsed.error.issues[0]?.message || 'Invalid body' }, 400);
  }

  const current = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: selectTenant,
  });
  if (!current) return json({ ok: false, error: 'Tenant not found' }, 404);

  const data: any = {};

  // Update plan
  if (parsed.data.plan) {
    data.plan = parsed.data.plan;
  }

  // Start trial (idempotent)
  if (parsed.data.startTrial) {
    const alreadyTrialing = current.billingStatus === 'TRIALING' && !!current.trialEndsAt;
    if (!alreadyTrialing && current.billingStatus === 'NONE' && !current.trialEndsAt) {
      data.billingStatus = 'TRIALING';
      data.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
  }

  const updated =
    Object.keys(data).length > 0
      ? await prisma.tenant.update({
          where: { id: tenantId },
          data,
          select: selectTenant,
        })
      : current;

console.log('[billing] tenantId=', tenantId, 'current=', {
  plan: current.plan,
  billingStatus: current.billingStatus,
  trialEndsAt: current.trialEndsAt,
}, 'raw=', raw);

console.log('[billing] applied=', data, 'updated=', {
  plan: updated.plan,
  billingStatus: updated.billingStatus,
  trialEndsAt: updated.trialEndsAt,
});

  return json({ ok: true, tenant: updated });
}
