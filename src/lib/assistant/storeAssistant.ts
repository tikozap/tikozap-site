// src/lib/assistant/storeAssistant.ts
import 'server-only';

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { formatNowInTz } from '@/lib/timezone';

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

function looksLikePlaceholderKey(key: string) {
  const k = (key || '').trim();
  if (!k) return true;
  const lower = k.toLowerCase();
  return (
    lower.includes('your_key') ||
    lower.includes('replace') ||
    lower.includes('repla') ||
    lower.includes('paste') ||
    lower === 'sk-xxxxx' ||
    lower === 'sk-your-key-here'
  );
}

function isDateTimeQuestion(textLower: string) {
  const t = (textLower || "").toLowerCase().trim();
  if (!t) return false;

  // Date / day
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

  // “system” wording
  if (t.includes("current date") || t.includes("date now")) return true;
  if (t.includes("date in your system") || t.includes("time in your system")) return true;

  return false;
}

function serverDateTimeReply() {
  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const dateLocal = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz,
  }).format(now);

  const timeLocal = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  }).format(now);

  return `Today is ${dateLocal}. Current time is ${timeLocal} (${tz}).`;
}

const CORE_KB_TITLES = [
  'Store Info',
  'Brand Voice',
  'Returns',
  'Shipping',
  'Sizing',
  'Other Notes',
] as const;

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

  const lower = text.toLowerCase();

const askedDateTime = isDateTimeQuestion(lower);

if (askedDateTime) {
  const now = new Date();

  // NOTE: In production servers, timezone is often UTC.
  // We'll explicitly show timezone so it's always "truthful".
  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZoneName: 'short',
  }).format(now);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(now);

  return `Today is ${dateStr}. Current time is ${timeStr}.`;
}

  // Load tenant/store profile
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { storeName: true, slug: true, timeZone: true },
  });

  const starter = await prisma.starterLink.findUnique({
    where: { tenantId },
    select: {
      title: true,
      tagline: true,
      phone: true,
      address: true,
      city: true,
      hoursJson: true, // treat as plain text
      buttonsJson: true,
      greeting: true,
      published: true,
      slug: true,
    },
  });

  // ✅ Always load core knowledge docs by title first (stable behavior)
  const coreDocs = await prisma.knowledgeDoc.findMany({
    where: { tenantId, title: { in: [...CORE_KB_TITLES] as any } },
    select: { title: true, content: true },
  });

  // Then load some recent “extra” docs (if the store adds many later)
  const extraDocs = await prisma.knowledgeDoc.findMany({
    where: { tenantId, title: { notIn: [...CORE_KB_TITLES] as any } },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    select: { title: true, content: true },
  });

  // Order core docs in the exact preferred order
  const coreByTitle = new Map(coreDocs.map((d) => [d.title, d]));
  const orderedCore = CORE_KB_TITLES.map((t) => coreByTitle.get(t)).filter(
    (x): x is { title: string; content: string } => Boolean(x),
  );

  const knowledge = [...orderedCore, ...extraDocs];

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

  const key = process.env.OPENAI_API_KEY || '';
  if (!key || looksLikePlaceholderKey(key)) {
    console.warn('[storeAssistantReply] OPENAI_API_KEY missing or placeholder; using safe fallback');
    return `Got it — can you share a little more detail so I can help? (Example: “hours”, “returns”, “shipping”, “order status”)`;
  }

  const storeName = starter?.title || tenant?.storeName || 'this store';

  const hoursText = starter?.hoursJson ? String(starter.hoursJson).trim() : null;

  const starterFactsRaw = [
    starter?.tagline ? `Tagline: ${starter.tagline}` : null,
    starter?.phone ? `Phone: ${starter.phone}` : null,
    starter?.address || starter?.city
      ? `Location: ${[starter.address, starter.city].filter(Boolean).join(', ')}`
      : null,
    hoursText ? `Hours: ${hoursText}` : null,
    channel ? `Channel: ${channel}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const kbRaw = knowledge.length
    ? knowledge
        .map((d, i) => `KB${i + 1}: ${d.title}\n${d.content || ''}`)
        .join('\n\n---\n\n')
    : '(No knowledge docs yet)';

  const starterFacts = clamp(starterFactsRaw, 2500);
  const kb = clamp(kbRaw, 9000);

  const client = new OpenAI({ apiKey: key });

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
