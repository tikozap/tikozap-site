// src/app/api/demo-assistant-v2/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  DEMO_BUCKET_TEXT,
  type DemoBucketName,
} from '@/config/demoAssistant';

// Use Node runtime (not edge) so the SDK works normally.
export const runtime = 'nodejs';
const BUILD_MARK = 'demo-assistant-2026-01-24a';

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const FALLBACK_DEFAULT =
  `TikoZap is an AI customer support platform for online stores.\n\n` +
  `It gives merchants a website chat widget + a Conversations inbox for staff, with human takeover, and a knowledge base to answer store questions (shipping/returns/orders) accurately.\n\n` +
  `Ask me about features, pricing, setup, or how it works.`;

function platformIntro(): string {
  return (
    `TikoZap is an AI customer support platform for online stores.\n\n` +
    `Merchants add a chat bubble widget to their site and manage conversations in a dashboard inbox. The AI answers common store questions and staff can take over any chat.\n\n` +
    `What do you want to explore—features, pricing, or setup?`
  );
}

function wrapStoreExample(example: string): string {
  return (
    `That’s a *store* question (what shoppers ask on a merchant’s site).\n\n` +
    `Here’s an example of how a store’s TikoZap assistant could answer:\n` +
    `${example}\n\n` +
    `In the real product, the merchant configures their policies/FAQs/knowledge (and optionally order integrations) so the assistant answers exactly for that store.\n` +
    `Want to see how setup works or what plans include?`
  );
}

function pickBucketReply(bucket: DemoBucketName | undefined): string {
  const safeBucket: DemoBucketName =
    bucket && bucket in DEMO_BUCKET_TEXT ? bucket : 'off_topic';

  const PLATFORM_BUCKETS = new Set<string>([
    'platform',
    'pricing',
    'plans',
    'features',
    'setup',
    'install',
    'widget',
    'knowledge',
    'security',
    'docs',
    'how_it_works',
  ]);

  if (safeBucket === 'off_topic' || PLATFORM_BUCKETS.has(String(safeBucket))) {
    return platformIntro();
  }

  const options = DEMO_BUCKET_TEXT[safeBucket] ?? [];
  if (options.length === 0) return platformIntro();

  const idx = Math.floor(Math.random() * options.length);
  const picked = (options[idx] ?? '').trim();
  if (!picked) return platformIntro();

  // Only wrap TRUE shopper-style buckets as “store examples”
  const STORE_EXAMPLE_BUCKETS = new Set<DemoBucketName>(['order', 'returns', 'sizing']);
  if (STORE_EXAMPLE_BUCKETS.has(safeBucket)) {
    return wrapStoreExample(picked);
  }

  // greeting / capabilities / language buckets should return directly
  return picked;
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));

    const userTextRaw =
      typeof body.userText === 'string' ? body.userText : '';
    const userText = userTextRaw.trim();
 
   const lower = userText.toLowerCase();

// ✅ Date/time questions should answer from server clock
const isDateTimeQuestion =
  /\b(what\s*(is|'s)\s*(the\s*)?(date|day)(\s+is\s+it)?(\s+today)?|today'?s\s*date|what\s*time\s*is\s*it|current\s+(date|time)|date\s+in\s+your\s+system)\b/i.test(lower);

if (isDateTimeQuestion) {
  const now = new Date();

  const dateLocal = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  const timeLocal = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  return NextResponse.json(
    { reply: `Today is ${dateLocal}. Current time is ${timeLocal}.` },
    { status: 200 }
  );
}

const isJustGreeting =
  /^(hi|hello|hey|good morning|good afternoon|good evening)\b[!?.\s]*$/i.test(lower);

if (isJustGreeting) {
  return NextResponse.json({
    reply:
      "Hi! I’m TikoZap Assistant. Want to explore features, pricing, or setup? " +
      "If you ask a shopper-style question (shipping/returns/order status), I’ll show an example answer too.",
   build: BUILD_MARK,
  });
}

    const bucket = body.bucket as DemoBucketName | undefined;
    const historyRaw = Array.isArray(body.history) ? body.history : [];

    // Debug: will appear in Vercel function logs when the route is called
    console.log(
      '[demo-assistant] env=',
      process.env.VERCEL_ENV ?? 'local',
      'hasKey=',
      !!process.env.OPENAI_API_KEY,
      'userText=',
      userText,
    );

    const history: HistoryMessage[] = historyRaw
      .map((m: any) => {
        if (!m || typeof m.content !== 'string') return null;
        if (m.role !== 'user' && m.role !== 'assistant') return null;
        return { role: m.role, content: m.content } as HistoryMessage;
      })
      .filter(Boolean) as HistoryMessage[];

    // ---------- Special case: “what is TikoZap / pricing / features / setup” ----------
    const mentionsTikoZap =
      lower.includes('tikozap') || lower.includes('tiko zap') || lower.includes('tikozap.com');

    const asksPlatformIntent =
      lower.includes('what is') ||
      lower.includes('pricing') ||
      lower.includes('price') ||
      lower.includes('plan') ||
      lower.includes('feature') ||
      lower.includes('how it works') ||
      lower.includes('setup') ||
      lower.includes('install') ||
      lower.includes('widget') ||
      lower.includes('dashboard');

    if (mentionsTikoZap && asksPlatformIntent) {
      const reply =
        `TikoZap is an AI customer support platform for online stores.\n\n` +
        `It includes:\n` +
        `• A website chat widget (chat bubble)\n` +
        `• A Conversations inbox for staff (human takeover)\n` +
        `• A knowledge/policies area to train accurate store answers\n` +
        `• Onboarding steps like Store → Plan → Billing → Knowledge → Widget → Install → Test\n\n` +
        `This demo doesn’t connect to real orders—it's a safe preview of how the assistant and workflow behave.\n\n` +
        `What are you evaluating: features, pricing, or setup?`;

      return NextResponse.json({ reply }, { status: 200 });
    }

    // If somehow no user text, just return a platform-focused canned answer.
    if (!userText) {
      const reply = pickBucketReply(bucket);
      return NextResponse.json({ reply });
    }

    // ---------- Translation detection ----------
    const lastAssistant = [...history]
      .reverse()
      .find((m) => m.role === 'assistant');

    const wantsTranslation =
      lower.includes('translate') ||
      lower.includes('翻译') ||
      lower.includes('翻成英文') ||
      lower.includes('转成英文') ||
      ((lower.includes('中文') || lower.includes('chinese')) && !!lastAssistant) ||
      ((lower.includes('英文') || lower.includes('english')) && !!lastAssistant);

    console.log(
      '[demo-assistant] wantsTranslation=',
      wantsTranslation,
      'hasLastAssistant=',
      !!lastAssistant,
    );

    let replyFromModel: string | null = null;

    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (wantsTranslation && lastAssistant) {
        // 🔤 Translation path
        const response = await client.responses.create({
          model: 'gpt-4.1',
          input: [
            {
              role: 'developer',
              content:
                'You are a bilingual Chinese–English translator.\n' +
                '- Decide the target language from the user request.\n' +
                '- If the user asks in Chinese (mentions “中文”), translate into Chinese.\n' +
                '- If the user asks in English (mentions “English”), translate into English.\n' +
                '- Output only the translated text, no extra commentary.',
            },
            {
              role: 'user',
              content:
                `User request: ${userText}\n\n` +
                `Text to translate:\n${lastAssistant.content}`,
            },
          ],
          max_output_tokens: 256,
        });

        replyFromModel = (response as any).output_text ?? null;
      } else {
        // ✅ PLATFORM ASSISTANT PATH (fixed)
        const messagesForModel: {
          role: 'developer' | 'user' | 'assistant';
          content: string;
        }[] = [
          {
            role: 'developer',
            content:
              'You are **TikoZap Assistant** — the product + onboarding assistant for the TikoZap platform.\n' +
              '\n' +
              'Your mission:\n' +
              '- Explain what TikoZap is: an AI customer support platform for online stores.\n' +
              '- Answer questions about: features, how it works, onboarding, pricing/plans, integrations, and what merchants get.\n' +
              '- Be confident: if the user asks “are you this kind of software?”, answer YES and explain.\n' +
              '- Keep replies short (2–5 sentences) and practical.\n' +
              '- This is a safe demo: never claim you can view/change real orders here.\n' +
              '\n' +
              'If the user asks store-style shopper questions (returns/shipping/order status/sizing):\n' +
              '1) Say briefly: “That’s what the merchant’s store assistant handles.”\n' +
              '2) Give an example store answer.\n' +
              '3) Explain what the merchant would configure in TikoZap (policies/FAQs/knowledge, optional order integrations).\n' +
              '\n' +
              'Product context you can reference:\n' +
              '- Website chat bubble widget + merchant dashboard inbox\n' +
              '- Human takeover per conversation\n' +
              '- Knowledge base / policies to improve accuracy\n' +
              '- Typical setup: Store → Plan → Billing → Knowledge → Widget → Install → Test\n' +
              '\n' +
              'Avoid suggesting “other specialized tools” — TikoZap IS the platform being evaluated.',
          },
          ...history,
          {
            role: 'user',
            content:
              `Bucket: ${bucket ?? 'off_topic'}.\n\n` +
              `User message: ${userText}\n\n` +
              'Reply in the appropriate language and stay focused on TikoZap (the platform).',
          },
        ];

        const response = await client.responses.create({
          model: 'gpt-4.1',
          input: messagesForModel as any, // cast keeps TS happy
          max_output_tokens: 256,
        });

        replyFromModel = (response as any).output_text ?? null;
      }
    } else {
      console.warn(
        'OPENAI_API_KEY is not set; /api/demo-assistant will use canned demo replies only.',
      );
    }

    const reply =
      (replyFromModel && replyFromModel.trim()) ||
      pickBucketReply(bucket) ||
      FALLBACK_DEFAULT;

return NextResponse.json({ reply, build: BUILD_MARK });
  } catch (error) {
    console.error('Error in /api/demo-assistant', error);
    return NextResponse.json({ reply: FALLBACK_DEFAULT });
  }
}
