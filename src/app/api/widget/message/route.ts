// src/app/api/widget/message/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { storeAssistantReply } from '@/lib/assistant/storeAssistant';

export const runtime = 'nodejs';

const BodySchema = z.object({
  text: z.string().trim().min(1).max(4000),
  conversationId: z.string().trim().optional(),
  key: z.string().trim().optional(), // optional: widget publicKey
  channel: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  tags: z.string().trim().optional(),
});

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function readCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') || '';
  const parts = raw.split(';').map((p) => p.trim());
  const hit = parts.find((p) => p.startsWith(name + '='));
  if (!hit) return '';
  return decodeURIComponent(hit.slice(name.length + 1));
}

async function resolveTenantId(req: Request, key?: string) {
  // (1) If key is provided, resolve tenant via Widget.publicKey
  if (key) {
    const w = await prisma.widget.findUnique({
      where: { publicKey: key },
      select: { tenantId: true, enabled: true },
    });
    if (w?.tenantId && w.enabled !== false) return w.tenantId;
  }

  // (2) Demo cookies (best effort)
  const demoTenantId = readCookie(req, 'tz_demo_tenant_id');
  if (demoTenantId) return demoTenantId;

  const demoTenantSlug = readCookie(req, 'tz_demo_tenant_slug');
  if (demoTenantSlug) {
    const t = await prisma.tenant.findUnique({
      where: { slug: demoTenantSlug },
      select: { id: true },
    });
    if (t?.id) return t.id;
  }

  // (3) If you later add a real session cookie token, you can resolve here.
  // Example cookie names you might use:
  // const token = readCookie(req, 'tz_session') || readCookie(req, 'tz_demo_session');
  // if (token) { ... lookup Session -> Membership -> Tenant ... }

  return '';
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { text, conversationId: inputConversationId, key, channel, subject, tags } = body.data;

    const tenantId = await resolveTenantId(req, key);
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: 'Missing tenantId' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find or create conversation
    let conversationId = (inputConversationId || '').trim();

    if (conversationId) {
      const c = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, tenantId: true },
      });

      // If provided id doesn't exist or doesn't belong to tenant, ignore it
      if (!c || c.tenantId !== tenantId) {
        conversationId = '';
      }
    }

    if (!conversationId) {
      const created = await prisma.conversation.create({
        data: {
          tenantId,
          channel: channel || 'web',
          subject: subject || 'Website chat',
          tags: tags || 'widget',
          customerName: 'Customer',
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });
      conversationId = created.id;
    }

    // Save customer message
    await prisma.message.create({
      data: {
        conversationId,
        role: 'customer',
        content: text,
      },
    });

    // Generate assistant reply
    const reply = await storeAssistantReply({
      tenantId,
      conversationId,
      userText: text,
      channel: channel || 'widget',
    });

    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: reply,
      },
    });

    // Return recent messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, conversationId, messages },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[widget/message] error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'widget message failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
