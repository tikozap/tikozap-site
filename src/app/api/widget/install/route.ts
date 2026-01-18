import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

const Body = z.object({
  installed: z.boolean(),
});

export async function POST(req: Request) {
  const authed = await getAuthedUserAndTenant();
  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { installed } = Body.parse(await req.json().catch(() => ({})));
  const tenantId = authed.tenant.id;

  const widget = await prisma.widget.upsert({
    where: { tenantId },
    create: {
      tenantId,
      installedAt: installed ? new Date() : null,
    },
    update: {
      installedAt: installed ? new Date() : null,
    },
    select: {
      tenantId: true,
      publicKey: true,
      installedAt: true,
      enabled: true,
      assistantName: true,
      greeting: true,
      brandColor: true,
    },
  });

  return NextResponse.json({ ok: true, widget });
}
