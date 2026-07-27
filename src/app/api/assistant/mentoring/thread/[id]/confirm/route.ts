// src/app/api/assistant/mentoring/thread/[id]/confirm/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const thread = await prisma.mentoringThread.update({
    where: { id: params.id },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
      appliedCount: 47,
      experienceReady: true,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    thread,
  });
}