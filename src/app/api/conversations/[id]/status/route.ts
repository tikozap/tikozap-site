import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const status = typeof body.status === 'string' ? body.status : '';

  if (!['open', 'waiting', 'closed'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
  }

  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: auth.tenant.id },
    select: { id: true },
  });
  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
