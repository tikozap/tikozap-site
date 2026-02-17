import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { buildSupportReply } from '@/lib/supportAssistant';
import { trackMetric } from '@/lib/metrics';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, {
      namespace: 'widget-message',
      limit: 120,
      windowMs: 60_000,
    });
    if (!rate.ok) {
      trackMetric({
        source: 'widget-message',
        event: 'rate_limited',
      });
      return NextResponse.json(
        { ok: false, error: 'Too many messages. Please try again shortly.' },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const body: any = await req.json().catch(() => ({}));

    const text = (body?.text || '').toString().trim();
    if (!text) return NextResponse.json({ ok: false, error: 'Missing text' }, { status: 400 });

    // Preferred: if the user is logged into the dashboard, use authed tenant.
    const auth = await getAuthedUserAndTenant().catch(() => null as any);

    // Fallback (demo): allow a tenantSlug, resolve tenant by slug.
    const tenantSlug = (body?.tenantSlug || '').toString().trim();

    let tenantId: string | null = auth?.tenant?.id ?? null;

    if (!tenantId) {
      if (!tenantSlug) return NextResponse.json({ ok: false, error: 'Missing tenantSlug' }, { status: 400 });

      // tolerate model casing
      const p: any = prisma as any;
      const tenantModel =
        p.tenant ?? p.Tenant ??
        p.workspace ?? p.Workspace ??
        p.merchant ?? p.Merchant;

      if (!tenantModel?.findUnique) {
        return NextResponse.json({ ok: false, error: 'No tenant model found in Prisma client.' }, { status: 500 });
      }

      const tenant = await tenantModel.findUnique({ where: { slug: tenantSlug } });
      if (!tenant?.id) {
        return NextResponse.json({ ok: false, error: 'Tenant not found for tenantSlug.' }, { status: 404 });
      }
      tenantId = tenant.id;
    }
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'Unable to resolve tenant' }, { status: 500 });
    }

    const customerName = (body?.customerName || 'Sophia').toString().trim() || 'Sophia';
    const channel = (body?.channel || 'web').toString().trim() || 'web';
    const subject = (body?.subject || 'Widget test').toString().trim() || 'Widget test';
    const aiEnabled = body?.aiEnabled === false ? false : true;

    let allowAi = aiEnabled;
    let conversationId = (body?.conversationId || '').toString().trim();

    // Create new conversation if needed
    if (!conversationId) {
      const convo = await prisma.conversation.create({
        data: {
          tenantId,
          customerName,
          subject,
          status: aiEnabled ? 'open' : 'waiting',
          channel,
          tags: (body?.tags || '').toString(),
          aiEnabled,
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });
      conversationId = convo.id;
    }

    // Append customer message
    await prisma.message.create({
      data: {
        conversationId,
        role: 'customer',
        content: text,
      },
    });

    // Optional assistant auto-reply (keeps test UX snappy)
    // Authority rule: DB decides whether AI can reply for THIS conversation.
    // If staff clicked Take over => conversation.aiEnabled=false => do NOT auto-reply.
    try {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { aiEnabled: true },
      });
      if (typeof existing?.aiEnabled === 'boolean') allowAi = existing.aiEnabled;
    } catch (e) {}

    if (allowAi) {
      const support = buildSupportReply(text);
      await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: support.reply,
        },
      });

      if (support.needsHuman) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'waiting' },
        });
      }

      trackMetric({
        source: 'widget-message',
        event: support.needsHuman ? 'needs_human_fallback' : 'answered',
        tenantId,
        intent: support.intent,
      });
    }

    // Keep conversation fresh
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, conversationId, messages });
  } catch (err: any) {
    console.error('[widget/message] error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'widget message failed' },
      { status: 500 }
    );
  }
}
