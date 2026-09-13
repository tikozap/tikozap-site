// src/app/api/admin/tiko/learning/route.ts

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { generateLearningAcknowledgement } from '@/lib/assistantCoaching';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  return String(value || '').trim();
}

function normalizeAudience(value: unknown) {
  return value === 'all_assistants'
    ? 'all_assistants'
    : 'tiko';
}

function normalizeContext(value: unknown) {
  if (value === 'marketing') return 'marketing';
  if (value === 'dashboard') return 'dashboard';

  return 'everywhere';
}

function normalizeChannel(value: unknown) {
  if (value === 'voice') return 'voice';
  if (value === 'text') return 'text';

  return 'all';
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
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

  const items = await prisma.tikoLearning.findMany({
    where: {
      active: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      instruction: true,
      summary: true,
      source: true,
      appliesText: true,
      appliesVoice: true,
      appliesTikoWeb: true,
      appliesTikoDash: true,
      appliesAssistants: true,
      active: true,
      createdAt: true,
      updatedAt: true,
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
  const admin = await requireAdmin();

  if (!admin) {
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

const appliesText =
  body.appliesText !== false;

const appliesVoice =
  body.appliesVoice !== false;

const appliesTikoWeb =
  body.appliesTikoWeb !== false;

const appliesTikoDash =
  body.appliesTikoDash !== false;

const appliesAssistants =
  body.appliesAssistants === true;

const fromTestCoach =
  body.fromTestCoach === true;

  if (!instruction) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Instruction is required.',
      },
      {
        status: 400,
      },
    );
  }

const reply = await generateLearningAcknowledgement(
  instruction,
  'Tiko',
);

const normalizedInstruction = reply
  .replace(/^Tiko noted:\s*/i, '')
  .trim();

const item = await prisma.tikoLearning.create({
data: {
  instruction:
    normalizedInstruction || instruction,

  summary:
    normalizedInstruction || instruction,

source: fromTestCoach
  ? 'admin_test_coaching'
  : 'admin_coaching',

appliesText,
appliesVoice,
appliesTikoWeb,
appliesTikoDash,
appliesAssistants,

active: true,
},
  select: {
    id: true,
    instruction: true,
    summary: true,
    source: true,
    appliesText: true,
    appliesVoice: true,
    appliesTikoWeb: true,
    appliesTikoDash: true,
    appliesAssistants: true,
    active: true,
    createdAt: true,
    updatedAt: true,
  },
});

return NextResponse.json({
  ok: true,
  reply,
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

  const admin = await requireAdmin();

  if (!admin) {
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
        error: 'Note id and instruction are required.',
      },
      {
        status: 400,
      },
    );
  }

  const existing = await prisma.tikoLearning.findFirst({
    where: {
      id,
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

  const item = await prisma.tikoLearning.update({
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
      active: true,
      createdAt: true,
      updatedAt: true,
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

  const admin = await requireAdmin();

  if (!admin) {
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

  const existing = await prisma.tikoLearning.findFirst({
    where: {
      id,
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

  await prisma.tikoLearning.update({
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