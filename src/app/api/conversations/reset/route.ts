import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { buildSupportReply } from '@/lib/supportAssistant';

export const runtime = 'nodejs';

type SeedMessage = {
  role: string;
  content: string;
};

type SeedConversation = {
  customerName: string;
  subject: string;
  tags: string;
  channel: string;
  status: 'open' | 'waiting' | 'closed';
  aiEnabled: boolean;
  messages: SeedMessage[];
};

function buildDemoSeeds(aiEnabled: boolean): SeedConversation[] {
  const assistantFor = (text: string) =>
    aiEnabled ? [{ role: 'assistant', content: buildSupportReply(text).reply }] : [];

  return [
    {
      customerName: 'Caller +19175353559',
      subject: 'Phone call +19175353559',
      tags: 'caller,answerMachine,voice',
      channel: 'phone',
      status: aiEnabled ? 'open' : 'waiting',
      aiEnabled,
      messages: [
        {
          role: 'system',
          content:
            'Call started. provider=twilio callSid=CA8971eec2e3d94895cf9f4f48ea2dddc8 from=+19175353559',
        },
        {
          role: 'user',
          content:
            'Voicemail received (recordingSid=<twilio-recording-id>). RecordingUrl: https://api.twilio.com/2010-04-01/Accounts/<twilio-account-id>/Recordings/<twilio-recording-id>',
        },
        ...(aiEnabled
          ? [
              {
                role: 'assistant',
                content:
                  'I captured the voicemail summary and flagged this caller for staff follow-up.',
              },
            ]
          : []),
      ],
    },
    {
      customerName: 'Website shopper',
      subject: 'Website bubble test',
      tags: 'chat-test,website-bubble,web',
      channel: 'web',
      status: aiEnabled ? 'open' : 'waiting',
      aiEnabled,
      messages: [
        { role: 'customer', content: 'Website chat bubble test: where is my order?' },
        ...assistantFor('Website chat bubble test: where is my order?'),
      ],
    },
    {
      customerName: 'Starter Link visitor',
      subject: 'Starter Link bubble test',
      tags: 'starter-link-bubble,no-website',
      channel: 'starter-link',
      status: aiEnabled ? 'open' : 'waiting',
      aiEnabled,
      messages: [
        {
          role: 'customer',
          content: 'I came from your Starter Link. Can you explain return steps?',
        },
        ...assistantFor('I came from your Starter Link. Can you explain return steps?'),
      ],
    },
    {
      customerName: 'Caller +14155550199',
      subject: 'AnswerMachine follow-up',
      tags: 'answerMachine,caller,voicemail',
      channel: 'phone',
      status: aiEnabled ? 'waiting' : 'waiting',
      aiEnabled,
      messages: [
        {
          role: 'system',
          content:
            'AnswerMachine event captured. provider=twilio callSid=CA3f75c9e1891e83ed5ec9725c22acfd4d',
        },
        {
          role: 'note',
          content:
            'Suggested callback: mention order-status update and offer a direct SMS follow-up link.',
        },
      ],
    },
    {
      customerName: 'Marketplace DM shopper',
      subject: 'Marketplace DM handoff test',
      tags: 'marketplace-dm,handoff',
      channel: 'marketplace',
      status: aiEnabled ? 'open' : 'waiting',
      aiEnabled,
      messages: [
        {
          role: 'customer',
          content:
            'Can we move this to your support link? I need help with a delayed shipment.',
        },
        ...assistantFor(
          'Can we move this to your support link? I need help with a delayed shipment.',
        ),
      ],
    },
  ];
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body?.aiEnabled === false ? false : true;

  await prisma.conversation.deleteMany({ where: { tenantId: auth.tenant.id } });

  const seeds = buildDemoSeeds(aiEnabled);
  for (const seed of seeds) {
    await prisma.conversation.create({
      data: {
        tenantId: auth.tenant.id,
        customerName: seed.customerName,
        subject: seed.subject,
        status: seed.status,
        channel: seed.channel,
        tags: seed.tags,
        aiEnabled: seed.aiEnabled,
        lastMessageAt: new Date(),
        messages: {
          create: seed.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
