// src/app/api/assistant/mentoring/thread/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildEmmaOpeningMessage(understanding: string) {
  return `Kevin, I'd like to check my understanding with you.

After helping several customers, ${understanding.charAt(0).toLowerCase()}${understanding.slice(1)}

Am I understanding your business correctly?`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tenantId = body.tenantId || 'test-tenant';
    const observationId = body.observationId;
    const title = body.title || "I'd like to check my understanding with you.";

    if (!observationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing observationId' },
        { status: 400 },
      );
    }

    const observation = await prisma.emmaObservation.findUnique({
      where: { id: observationId },
    });

    if (!observation) {
      return NextResponse.json(
        { ok: false, error: 'Observation not found' },
        { status: 404 },
      );
    }

    const thread = await prisma.mentoringThread.create({
      data: {
        tenantId,
        observationId,
        title,
        status: 'open',
        messages: {
          create: {
            role: 'emma',
            content: buildEmmaOpeningMessage(observation.summary),
          },
        },
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
  } catch (err) {
    console.error('[Mentoring Thread] Failed to create thread', err);

    return NextResponse.json(
      { ok: false, error: 'Failed to create mentoring thread' },
      { status: 500 },
    );
  }
}