// src/app/api/assistant/mentoring/thread/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const thread = await prisma.mentoringThread.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!thread) {
    return NextResponse.json(
      { ok: false, error: 'Thread not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    thread,
  });
}