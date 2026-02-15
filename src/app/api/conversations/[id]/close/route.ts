// src/app/api/conversations/[id]/close/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const Body = z
  .object({
    closed: z.boolean().optional(), // true=close, false=reopen
  })
  .optional();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  const closed = parsed.success ? (parsed.data?.closed ?? true) : true;

  const nextStatus = closed ? 'closed' : 'open';

  const updated = await prisma.conversation.updateMany({
    where: { id: params.id, tenantId: auth.tenant.id },
    data: { status: nextStatus },
  });

  if (!updated.count) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, status: nextStatus });
}
