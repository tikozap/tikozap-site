import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { buildSupportReply } from '@/lib/supportAssistant';
import { canCreateConversationForTenant } from '@/lib/billingUsage';
import { trackMetric } from '@/lib/metrics';

export const runtime = 'nodejs';

function splitTags(csv: string) {
  return (csv || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildNewTestChat(aiEnabled: boolean) {
  const names = ['Mia', 'Sophia', 'Emma', 'Ava', 'Olivia', 'Isabella', 'Chloe', 'Amelia'];
  const topics = [
    { subject: 'Return policy question', first: 'What is your return policy?', tags: ['returns'], channel: 'web' },
    { subject: 'Shipping time', first: 'How many days does shipping take?', tags: ['shipping'], channel: 'web' },
    { subject: 'Size availability', first: 'Do you have this dress in XL?', tags: ['sizing'], channel: 'shopify' },
    { subject: 'Order status', first: 'Where is my order? I placed it last week.', tags: ['order-status'], channel: 'email' },
  ];

  const topic = pick(topics);
  const order = Math.random() < 0.6 ? ` · Order #${1000 + Math.floor(Math.random() * 900)}` : '';
  const customerName = `${pick(names)}${order}`;

  const customerMsg = topic.first;
  const assistantMsg = buildSupportReply(customerMsg).reply;

  return {
    customerName,
    subject: topic.subject,
    status: aiEnabled ? 'open' : 'waiting',
    channel: topic.channel,
    tags: topic.tags.join(','),
    aiEnabled,
    messages: [
      { role: 'customer', content: customerMsg },
      ...(aiEnabled ? [{ role: 'assistant', content: assistantMsg }] : []),
    ],
  };
}

export async function GET(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const includeArchived = url.searchParams.get('includeArchived') === '1';

  const rows = await prisma.conversation.findMany({
    where: {
      tenantId: auth.tenant.id,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { lastMessageAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 6 } },
  });

  const conversations = rows.map((c: any) => {
    const preview = c.messages.find((m: any) => m.role !== 'note') ?? c.messages[0] ?? null;

    return {
      id: c.id,
      customerName: c.customerName,
      subject: c.subject,
      status: c.status,
      channel: c.channel,
      aiEnabled: c.aiEnabled,
      tags: splitTags(c.tags),
      lastMessageAt: c.lastMessageAt,
      archivedAt: c.archivedAt,
      preview: preview ? { role: preview.role, content: preview.content, createdAt: preview.createdAt } : null,
    };
  });

  return NextResponse.json({ ok: true, conversations });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body?.aiEnabled === false ? false : true;

  const allowance = await canCreateConversationForTenant(auth.tenant.id);
  if (!allowance.ok) {
    await trackMetric({
      source: 'conversations',
      event: 'billing_limit_blocked',
      tenantId: auth.tenant.id,
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          'Monthly conversation limit reached for your current plan. Upgrade in Billing to continue.',
        usage: allowance.usage,
      },
      { status: 402 },
    );
  }

  const draft = buildNewTestChat(aiEnabled);

  const convo = await prisma.conversation.create({
    data: {
      tenantId: auth.tenant.id,
      customerName: draft.customerName,
      subject: draft.subject,
      status: draft.status,
      channel: draft.channel,
      tags: draft.tags,
      aiEnabled: draft.aiEnabled,
      lastMessageAt: new Date(),
      archivedAt: null,
      messages: { create: draft.messages.map((m) => ({ role: m.role, content: m.content })) },
    },
  });

  return NextResponse.json({ ok: true, id: convo.id });
}
