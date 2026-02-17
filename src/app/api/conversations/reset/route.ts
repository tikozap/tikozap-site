import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { buildSupportReply } from '@/lib/supportAssistant';

export const runtime = 'nodejs';

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
    const assistantMsg = buildSupportReply(customerMsg).reply;

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
