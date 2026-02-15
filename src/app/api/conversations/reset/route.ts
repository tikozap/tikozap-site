// src/app/api/conversations/reset/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';

export const runtime = 'nodejs';

function assistantAutoReply(customerText: string) {
  const t = (customerText || '').toLowerCase();
  if (t.includes('return')) return 'Returns are accepted within 30 days if items are unworn with tags. Want me to outline the return steps?';
  if (t.includes('ship') || t.includes('delivery')) return 'Orders ship in 1–2 business days. Typical US delivery is 3–7 business days. What’s your ZIP code?';
  if (t.includes('order') || t.includes('tracking')) return 'I can help—please share your order number and the email used at checkout so I can check the status.';
  if (t.includes('xl') || t.includes('size')) return 'I can help with sizing. Which item are you looking at, and what size do you usually wear?';
  return 'Got it. Can you share a little more detail so I can help faster?';
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body?.aiEnabled === false ? false : true;

  await prisma.conversation.deleteMany({ where: { tenantId: auth.tenant.id } });

  const seeds = [
    { customerName: 'Alex · Order #1043', subject: 'Order status', first: 'Where is my order? I placed it last week.', tags: 'order-status', channel: 'email' },
    { customerName: 'Mia', subject: 'Return policy question', first: 'What is your return policy?', tags: 'returns', channel: 'web' },
    { customerName: 'Sophia', subject: 'Shipping time', first: 'How many days does shipping take?', tags: 'shipping', channel: 'web' },
    { customerName: 'Emma', subject: 'Size availability', first: 'Do you have this dress in XL?', tags: 'sizing', channel: 'shopify' },
  ];

  for (const s of seeds) {
    const customerMsg = s.first;
    const assistantMsg = assistantAutoReply(customerMsg);

    await prisma.conversation.create({
      data: {
        tenantId: auth.tenant.id,
        customerName: s.customerName,
        subject: s.subject,
        status: aiEnabled ? 'open' : 'waiting',
        channel: s.channel,
        tags: s.tags,
        aiEnabled,
        lastMessageAt: new Date(),
        messages: {
          create: [
            { role: 'customer', content: customerMsg },
            ...(aiEnabled ? [{ role: 'assistant', content: assistantMsg }] : []),
          ],
        },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
