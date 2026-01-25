// src/app/api/l/[slug]/conversation/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const link = await prisma.starterLink.findFirst({
    where: { slug: params.slug, published: true },
    select: { tenantId: true },
  });

  if (!link) return NextResponse.json({ error: 'StarterLink not found' }, { status: 404 });

  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: link.tenantId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  return NextResponse.json({
    messages: convo.messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
