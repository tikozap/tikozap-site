// src/app/api/conversations/[id]/tags/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tags = Array.isArray(body.tags) ? body.tags : [];

  const clean = tags
    .map((t: any) => (typeof t === 'string' ? t.trim() : ''))
    .filter(Boolean);

  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: auth.tenant.id },
    select: { id: true },
  });
  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { tags: clean.join(',') },
  });

  return NextResponse.json({ ok: true });
}
