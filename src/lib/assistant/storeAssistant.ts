// src/lib/assistant/storeAssistant.ts
import 'server-only';

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

type Role = 'user' | 'assistant';

function toModelRole(role: string): Role | null {
  if (role === 'customer') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'staff') return 'assistant'; // staff takeover reads as assistant
  return null; // ignore notes etc
}

function clamp(s: string, max = 8000) {
  const t = (s ?? '').trim();
  if (t.length <= max) return t;
  return t.slice(0, max) + '\n…(truncated)';
}

export async function storeAssistantReply(opts: {
  tenantId: string;
  conversationId: string;
  userText: string;
  channel?: string; // widget | starter_link | web | etc
}) {
  const { tenantId, conversationId, userText, channel } = opts;

  const text = (userText ?? '').trim();
  if (!text) {
    return `Got it — can you share a little more detail so I can help? (Example: “hours”, “returns”, “shipping”, “order status”)`;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { storeName: true, slug: true },
  });

  const starter = await prisma.starterLink.findUnique({
    where: { tenantId },
    select: {
      title: true,
      tagline: true,
      phone: true,
      address: true,
      city: true,
      hoursJson: true, // we'll treat as plain text (option 1)
      buttonsJson: true,
      greeting: true,
      published: true,
      slug: true,
    },
  });

  const knowledge = await prisma.knowledgeDoc.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    select: { title: true, content: true },
  });

  // Pull recent history (newest first → reverse to chronological)
  const msgs = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { role: true, content: true },
  });

  let history = msgs
    .reverse()
    .map((m) => {
      const r = toModelRole(m.role);
      if (!r) return null;
      return { role: r, content: m.content ?? '' };
    })
    .filter((x): x is { role: Role; content: string } => Boolean(x));

  // ✅ De-dup current user text if it’s already the last message
  const last = history[history.length - 1];
  if (last?.role === 'user' && last.content.trim() === text) {
    history = history.slice(0, -1);
  }

  // Safe fallback if no key
  if (!process.env.OPENAI_API_KEY) {
    return `Got it — can you share a little more detail so I can help? (Example: “hours”, “returns”, “shipping”, “order status”)`;
  }

  const storeName = starter?.title || tenant?.storeName || 'this store';

  // Option 1: treat hoursJson as plain text (no JSON parsing)
  const hoursText = starter?.hoursJson ? String(starter.hoursJson).trim() : null;

  const starterFactsRaw = [
    starter?.tagline ? `Tagline: ${starter.tagline}` : null,
    starter?.phone ? `Phone: ${starter.phone}` : null,
    starter?.address || starter?.city
      ? `Location: ${[starter.address, starter.city].filter(Boolean).join(', ')}`
      : null,
    hoursText ? `Hours: ${hoursText}` : null,
    starter?.buttonsJson ? `Buttons JSON: ${starter.buttonsJson}` : null,
    channel ? `Channel: ${channel}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const kbRaw = knowledge.length
    ? knowledge
        .map((d, i) => `KB${i + 1}: ${d.title}\n${d.content}`)
        .join('\n\n---\n\n')
    : '(No knowledge docs yet)';

  const starterFacts = clamp(starterFactsRaw, 2500);
  const kb = clamp(kbRaw, 9000);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'developer',
        content:
          `You are the customer-support assistant for "${storeName}".\n` +
          `Rules:\n` +
          `- Use ONLY the provided store facts + knowledge docs. If unknown, ask 1 short follow-up.\n` +
          `- Do NOT invent policies, prices, or order status.\n` +
          `- Keep answers short (2–6 sentences), helpful, and store-like.\n` +
          `- If asked about the TikoZap platform, say you’re the store assistant and suggest contacting the store owner.\n\n` +
          `Store facts:\n${starterFacts}\n\n` +
          `Knowledge base:\n${kb}\n`,
      },
      ...history,
      { role: 'user', content: text },
    ],
    max_output_tokens: 220,
  });

  return (
    ((response as any).output_text ?? '').trim() ||
    `Thanks — can you share a bit more detail so I can help?`
  );
}

