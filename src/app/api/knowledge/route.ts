// src/app/api/knowledge/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

const Body = z.object({
  // existing
  returns: z.string().optional().nullable(),
  shipping: z.string().optional().nullable(),
  sizing: z.string().optional().nullable(),

  // new (Simple mode)
  storeInfo: z.string().optional().nullable(),
  brandVoice: z.string().optional().nullable(),
  otherNotes: z.string().optional().nullable(),
});

function norm(s: unknown) {
  const t = String(s ?? '').trim();
  return t.length ? t : '';
}

async function upsertOrDelete(tenantId: string, title: string, content: string) {
  const existing = await prisma.knowledgeDoc.findFirst({
    where: { tenantId, title },
    select: { id: true },
  });

  // If user clears a section, delete the doc (keeps the model context clean)
  if (!content) {
    if (existing?.id) {
      await prisma.knowledgeDoc.delete({ where: { id: existing.id } });
    }
    return;
  }

  if (existing?.id) {
    await prisma.knowledgeDoc.update({
      where: { id: existing.id },
      data: { content },
    });
  } else {
    await prisma.knowledgeDoc.create({
      data: { tenantId, title, content },
    });
  }
}

export async function GET() {
  try {
    const auth = await getAuthedUserAndTenant();
    const tenantId = auth?.tenant?.id;
    if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const docs = await prisma.knowledgeDoc.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: { title: true, content: true },
    });

    return NextResponse.json({ ok: true, docs });
  } catch (err: any) {
    console.error('[api/knowledge][GET]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthedUserAndTenant();
    const tenantId = auth?.tenant?.id;
    if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = Body.parse(await req.json().catch(() => ({})));

    // Titles are intentionally stable so storeAssistantReply can read them reliably
    const desired = [
      { title: 'Store Info', content: norm(body.storeInfo) },
      { title: 'Brand Voice', content: norm(body.brandVoice) },
      { title: 'Returns', content: norm(body.returns) },
      { title: 'Shipping', content: norm(body.shipping) },
      { title: 'Sizing', content: norm(body.sizing) },
      { title: 'Other Notes', content: norm(body.otherNotes) },
    ];

    for (const d of desired) {
      await upsertOrDelete(tenantId, d.title, d.content);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/knowledge][POST]', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}
