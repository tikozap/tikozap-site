// src/lib/assistant/storeAssistant.ts
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

export async function storeAssistantReply(args: {
  tenantId: string;
  conversationId: string;
  userText: string;
  channel?: string; // e.g. "phone"
}): Promise<string> {
  const userText = (args.userText || '').trim();
  if (!userText) return 'Sorry — I didn’t catch that. Could you say it again?';

  const tenant = await prisma.tenant.findUnique({
    where: { id: args.tenantId },
    select: { storeName: true },
  });

  const storeName = tenant?.storeName || 'the store';

  // If no OpenAI key (or in dev), return a safe fallback
const openai = getOpenAI();

if (!openai) {
  return `Thanks for calling ${storeName}. Could you share your order number or the email used for your purchase?`;
}

  const system = [
    `You are a customer-ops phone agent for "${storeName}".`,
    `Reply in a friendly, natural spoken style.`,
    `Keep responses short: 1–2 sentences.`,
    `If you need more info, ask ONE question.`,
    `If request is complex/urgent, suggest a human follow-up and ask for best callback number.`,
  ].join(' ');

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_SUPPORT || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userText },
    ],
    temperature: 0.3,
    max_tokens: 120,
  });

  const out = resp.choices?.[0]?.message?.content?.trim() || '';
  return out || `Thanks for calling ${storeName}. What can I help you with today?`;
}