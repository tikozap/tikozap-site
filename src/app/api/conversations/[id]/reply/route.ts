// src/app/api/conversations/[id]/reply/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const Body = z.object({
  text: z.string().min(1).max(4000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });

  const convo = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: auth.tenant.id },
    select: { id: true },
  });
  if (!convo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  // Create staff message
  await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: 'staff',
      content: parsed.data.text.trim(),
    },
  });

  // Staff takeover behavior (recommended for stability):
  // - bump lastMessageAt
  // - reopen if closed
  // - unarchive if archived
  // - disable AI (so it won’t fight the human)
  await prisma.conversation.update({
    where: { id: convo.id },
    data: {
      lastMessageAt: new Date(),
      status: 'open',
      archivedAt: null,
      aiEnabled: false,
    },
  });

  return NextResponse.json({ ok: true });
}
