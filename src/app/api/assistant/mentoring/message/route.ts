// src/app/api/assistant/mentoring/message/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createEmmaMentoringReply } from '@/lib/emmaMentoringEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const threadId = body.threadId;
    const content = String(body.content || '').trim();

    if (!threadId || !content) {
      return NextResponse.json(
        { ok: false, error: 'Missing threadId or content' },
        { status: 400 },
      );
    }

    const thread = await prisma.mentoringThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json(
        { ok: false, error: 'Thread not found' },
        { status: 404 },
      );
    }

    await prisma.mentoringMessage.create({
      data: {
        threadId,
        role: 'merchant',
        content,
      },
    });

    const messages = await prisma.mentoringMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });

    const emmaReply = await createEmmaMentoringReply({
      threadMessages: messages,
      merchantMessage: content,
    });

    await prisma.mentoringMessage.create({
      data: {
        threadId,
        role: 'emma',
        content: emmaReply,
      },
    });

    const updatedThread = await prisma.mentoringThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      thread: updatedThread,
    });
  } catch (err) {
    console.error('[Mentoring Message] Failed to send message', err);

    return NextResponse.json(
      { ok: false, error: 'Failed to send mentoring message' },
      { status: 500 },
    );
  }
}