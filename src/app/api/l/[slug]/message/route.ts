// "src/app/api/l/[slug]/message/route.ts"
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { storeAssistantReply } from '@/lib/assistant/storeAssistant';

export const runtime = 'nodejs';

const Body = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1).max(2000),
});

function isDateTimeQuestion(text: string) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return false;

  // Common “date/day” phrasings
  if (t.includes("what date") && (t.includes("today") || t.includes("it"))) return true;
  if (t.includes("what day") && (t.includes("today") || t.includes("it"))) return true;
  if (t.includes("what day is it")) return true;
  if (t.includes("today's date") || t.includes("todays date")) return true;
  if (t.includes("today's day") || t.includes("todays day")) return true;

  // Month / year
  if (t.includes("what month") || t.includes("which month")) return true;
  if (t.includes("what year") || t.includes("which year")) return true;

  // Time
  if (t.includes("what time") || t.includes("current time") || t.includes("time now")) return true;

  // Explicit “system” wording
  if (t.includes("current date") || t.includes("date now")) return true;
  if (t.includes("date in your system") || t.includes("time in your system")) return true;

  return false;
}

function serverDateTimeReply() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZoneName: "short",
  }).format(now);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(now);

  return `Today is ${dateStr}. Current time is ${timeStr}.`;
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const parsed = Body.parse(await req.json());
    const content = parsed.content.trim();

    const link = await prisma.starterLink.findFirst({
      where: { slug: params.slug, published: true },
      select: { tenantId: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'StarterLink not found' },
        { status: 404 },
      );
    }

    // Use existing conversation if valid for this tenant, otherwise create a new one
    const existing = parsed.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: parsed.conversationId, tenantId: link.tenantId },
          select: { id: true },
        })
      : null;

    const conversationId =
      existing?.id ??
      (
        await prisma.conversation.create({
          data: {
            tenantId: link.tenantId,
            channel: 'starter_link',
            status: 'open',
            aiEnabled: true,
            customerName: 'Customer',
            subject: 'Starter Link',
            tags: 'starter_link,no_website',
            lastMessageAt: new Date(),
          },
          select: { id: true },
        })
      ).id;

    // Save customer message
    await prisma.message.create({
      data: {
        conversationId,
        role: 'customer',
        content,
      },
    });

// ✅ Date/time questions: answer from SERVER clock (no OpenAI needed)
if (isDateTimeQuestion(content)) {
  const reply = serverDateTimeReply();

  await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: reply,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ conversationId });
}

    // Generate assistant reply (smart, but won't invent facts)
    let reply = '';
    try {
      reply = await storeAssistantReply({
        tenantId: link.tenantId,
        conversationId,
        userText: content,
        channel: 'starter_link',
      });
    } catch (e) {
      console.error('[l/message] storeAssistantReply failed; fallback', e);
      reply =
        'Got it — can you share a little more detail so I can help? (Example: “hours”, “returns”, “shipping”, “order status”)';
    }

    // Save assistant reply
    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: reply,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ conversationId });
  } catch (err: any) {
    console.error('[l/message] error', err);
    return NextResponse.json(
      { error: err?.message || 'message failed' },
      { status: 500 },
    );
  }
}
