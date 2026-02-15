// src/app/api/conversations/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const id = params.id;

  const convo = await prisma.conversation.findFirst({
    where: { id, tenantId: auth.tenant.id },
    select: {
      id: true,
      customerName: true,
      subject: true,
      status: true,
      channel: true,
      aiEnabled: true,
      tags: true,
      lastMessageAt: true,
      archivedAt: true,
    },
  });

  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    conversation: {
      ...convo,
      tags: (convo.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      messages,
    },
  });
}
