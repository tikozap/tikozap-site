import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

function splitTags(csv: string) {
  return (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: auth.tenant.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    conversation: {
      id: convo.id,
      customerName: convo.customerName,
      subject: convo.subject,
      status: convo.status,
      channel: convo.channel,
      aiEnabled: convo.aiEnabled,
      tags: splitTags(convo.tags),
      lastMessageAt: convo.lastMessageAt,
      messages: convo.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    },
  });
}
