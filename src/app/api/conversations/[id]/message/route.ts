import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

const ALLOWED = new Set(['customer', 'assistant', 'staff', 'note']);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const role = typeof body.role === 'string' ? body.role : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!ALLOWED.has(role)) return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
  if (!content) return NextResponse.json({ ok: false, error: 'Empty message' }, { status: 400 });

  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: auth.tenant.id },
    select: { id: true },
  });
  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  await prisma.message.create({
    data: { conversationId: params.id, role, content },
  });

  if (role !== 'note') {
    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
