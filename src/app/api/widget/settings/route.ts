// src/app/api/widget/settings/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

const Body = z.object({
  enabled: z.boolean().optional().nullable(),
  assistantName: z.string().max(80).optional().nullable(),
  greeting: z.string().max(400).optional().nullable(),
  brandColor: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((v) => !v || /^#?[0-9a-fA-F]{6}$/.test(v), 'brandColor must be a hex like #111111'),
});

function normalizeHex(v: string | null | undefined) {
  if (!v) return null;
  return v.startsWith('#') ? v : `#${v}`;
}

const selectWidget = {
  tenantId: true,
  publicKey: true,
  installedAt: true,
  enabled: true,
  assistantName: true,
  greeting: true,
  brandColor: true,
} as const;


export async function GET() {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = authed.tenant.id;

  let widget = await prisma.widget.findUnique({
    where: { tenantId },
    select: selectWidget,
  });

  if (!widget) {
    widget = await prisma.widget.create({
      data: { tenantId }, // enabled defaults true in schema
      select: selectWidget,
    });
  }

  return NextResponse.json({ ok: true, widget });
}

export async function POST(req: Request) {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = authed.tenant.id;

  const raw = await req.json().catch(() => ({}));
  const body = Body.parse(raw);

  const has = (k: string) => Object.prototype.hasOwnProperty.call(raw, k);

  // enabled is special: only accept boolean; ignore null
  const enabledVal = typeof body.enabled === 'boolean' ? body.enabled : undefined;

  const widget = await prisma.widget.upsert({
    where: { tenantId },
    create: {
      tenantId,
      enabled: enabledVal ?? true,
      assistantName: has('assistantName') ? body.assistantName ?? null : null,
      greeting: has('greeting') ? body.greeting ?? null : null,
      brandColor: has('brandColor') ? normalizeHex(body.brandColor ?? null) : null,
    },
    update: {
      ...(has('enabled') && enabledVal !== undefined ? { enabled: enabledVal } : {}),
      ...(has('assistantName') ? { assistantName: body.assistantName ?? null } : {}),
      ...(has('greeting') ? { greeting: body.greeting ?? null } : {}),
      ...(has('brandColor') ? { brandColor: normalizeHex(body.brandColor ?? null) } : {}),
    },
    select: selectWidget,
  });

  return NextResponse.json({ ok: true, widget });
}
