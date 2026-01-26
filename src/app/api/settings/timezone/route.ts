import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { DEFAULT_TZ } from '@/lib/timezone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  timeZone: z.string().min(3).max(80),
});

export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const row = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: { timeZone: true },
  });

  return NextResponse.json({ ok: true, timeZone: row?.timeZone || DEFAULT_TZ });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: auth.tenant.id },
    data: { timeZone: parsed.data.timeZone },
  });

  return NextResponse.json({ ok: true });
}
