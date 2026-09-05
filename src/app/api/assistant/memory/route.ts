// src/app/api/assistant/memory/route.ts

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { getAssistantIdentity } from '@/lib/assistantContext';
import { saveAssistantCoaching } from '@/lib/assistantCoaching';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  return String(value || '').trim();
}

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  const items = await prisma.assistantLearning.findMany({
    where: {
      tenantId: auth.tenant.id,
      active: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      instruction: true,
      summary: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      conversationId: true,
    },
  });

  return NextResponse.json({
    ok: true,
    items,
  });
}

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  const body = await req.json().catch(() => ({}));
  const instruction = clean(body.instruction);

  if (!instruction) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Note is required.',
      },
      {
        status: 400,
      },
    );
  }

  const assistantIdentity = await getAssistantIdentity(
    auth.tenant.id,
  );

  const result = await saveAssistantCoaching({
    tenantId: auth.tenant.id,
    guidance: instruction,
    instruction,
    assistantName:
      assistantIdentity.name?.trim() || 'Assistant',
    conversationId: null,
    source: 'manual_memory',
  });

  if (!result.learned || !result.learningId) {
    return NextResponse.json({
      ok: true,
      learned: false,
      reply: result.reply,
      catalogType: result.catalogType,
      item: null,
    });
  }

  const item = await prisma.assistantLearning.findFirst({
    where: {
      id: result.learningId,
      tenantId: auth.tenant.id,
      active: true,
    },
    select: {
      id: true,
      instruction: true,
      summary: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      conversationId: true,
    },
  });

  return NextResponse.json({
    ok: true,
    learned: true,
    reply: result.reply,
    catalogType: null,
    item,
  });
}

export async function PATCH(req: Request) {
  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}

  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  const body = await req.json().catch(() => ({}));

  const id = clean(body.id);
  const instruction = clean(body.instruction);

  if (!id || !instruction) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Note id and content are required.',
      },
      {
        status: 400,
      },
    );
  }

  const existing = await prisma.assistantLearning.findFirst({
    where: {
      id,
      tenantId: auth.tenant.id,
      active: true,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Note not found.',
      },
      {
        status: 404,
      },
    );
  }

  const item = await prisma.assistantLearning.update({
    where: {
      id,
    },
    data: {
      instruction,
      summary: instruction,
    },
    select: {
      id: true,
      instruction: true,
      summary: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      conversationId: true,
    },
  });

  return NextResponse.json({
    ok: true,
    item,
  });
}

export async function DELETE(req: Request) {
  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}

  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  const body = await req.json().catch(() => ({}));
  const id = clean(body.id);

  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Note id is required.',
      },
      {
        status: 400,
      },
    );
  }

  const existing = await prisma.assistantLearning.findFirst({
    where: {
      id,
      tenantId: auth.tenant.id,
      active: true,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Note not found.',
      },
      {
        status: 404,
      },
    );
  }

  await prisma.assistantLearning.update({
    where: {
      id,
    },
    data: {
      active: false,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}