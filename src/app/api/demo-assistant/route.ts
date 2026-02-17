
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  DEMO_BUCKET_TEXT,
  type DemoBucketName,
} from '@/config/demoAssistant';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { trackMetric } from '@/lib/metrics';

// Use Node runtime (not edge) so the SDK works normally.
export const runtime = 'nodejs';

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type DemoReplySource = 'rule' | 'model' | 'canned';

type DemoReplyMeta = {
  scoreDelta: {
    accuracy: number;
    safety: number;
    handoff: number;
    setupFit: number;
  };
  signals: {
    mentionsStarterLink: boolean;
    mentionsHandoff: boolean;
    mentionsSafePreview: boolean;
    mentionsSetupPath: boolean;
  };
};

function buildReplyMeta(reply: string, source: DemoReplySource): DemoReplyMeta {
  const lower = (reply || '').toLowerCase();
  const mentionsStarterLink = lower.includes('starter link') || lower.includes('no website');
  const mentionsHandoff =
    lower.includes('handoff') ||
    lower.includes('human') ||
    lower.includes('team') ||
    lower.includes('take over') ||
    lower.includes('escalat');
  const mentionsSafePreview =
    lower.includes('safe preview') ||
    lower.includes('demo') ||
    lower.includes('sample data') ||
    lower.includes('real orders');
  const mentionsSetupPath =
    lower.includes('setup') ||
    lower.includes('install') ||
    lower.includes('connect') ||
    lower.includes('inbox') ||
    lower.includes('knowledge');

  const base =
    source === 'model'
      ? { accuracy: 8, safety: 6, handoff: 4, setupFit: 5 }
      : source === 'rule'
      ? { accuracy: 7, safety: 7, handoff: 5, setupFit: 6 }
      : { accuracy: 5, safety: 5, handoff: 3, setupFit: 4 };

  return {
    scoreDelta: {
      accuracy: base.accuracy + (reply.length > 100 ? 1 : 0),
      safety: base.safety + (mentionsSafePreview ? 2 : 0),
      handoff: base.handoff + (mentionsHandoff ? 4 : 0),
      setupFit: base.setupFit + (mentionsStarterLink || mentionsSetupPath ? 3 : 0),
    },
    signals: {
      mentionsStarterLink,
      mentionsHandoff,
      mentionsSafePreview,
      mentionsSetupPath,
    },
  };
}

function jsonReply(reply: string, source: DemoReplySource) {
  const meta = buildReplyMeta(reply, source);
  return NextResponse.json({
    reply,
    source,
    safePreview: true,
    meta,
  });
}

const FALLBACK_DEFAULT =
  `TikoZap is an AI customer support platform for online stores.\n\n` +
  `It gives merchants a website chat widget + a Conversations inbox for staff, with human takeover, and a knowledge base to answer store questions (shipping/returns/orders) accurately.\n\n` +
  `Ask me about features, pricing, setup, or how it works.`;

function platformIntro(): string {
  return (
    `TikoZap is an AI customer support platform for online stores.\n\n` +
    `Merchants can use a website chat widget, or use Starter Link if they do not have a website yet, and manage conversations in a dashboard inbox. The AI answers common store questions and staff can take over any chat.\n\n` +
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

  // If your config has platform-ish buckets, we’ll treat them as platform.
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

  // If the bucket is off_topic or platform-ish, return platform messaging.
  if (safeBucket === 'off_topic' || PLATFORM_BUCKETS.has(String(safeBucket))) {
    return platformIntro();
  }

  // Otherwise, use your existing canned text as a “store example” and wrap it.
  const options = DEMO_BUCKET_TEXT[safeBucket] ?? [];
  if (options.length === 0) return platformIntro();

  const idx = Math.floor(Math.random() * options.length);
  const example = options[idx] ?? '';
  if (!example) return platformIntro();

  return wrapStoreExample(example);
}

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(req, {
      namespace: 'demo-assistant',
      limit: 60,
      windowMs: 60_000,
    });
    if (!rate.ok) {
      await trackMetric({ source: 'demo-assistant', event: 'rate_limited' });
      return NextResponse.json(
        { ok: false, error: 'Too many demo requests. Please try again shortly.' },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const body: any = await req.json().catch(() => ({}));

    const userTextRaw =
      typeof body.userText === 'string' ? body.userText : '';
    const userText = userTextRaw.trim();
    const lower = userText.toLowerCase();
    const bucket = body.bucket as DemoBucketName | undefined;
    const historyRaw = Array.isArray(body.history) ? body.history : [];

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

    const asksStarterLink =
      lower.includes('starter link') ||
      ((lower.includes('no website') || lower.includes("don't have a website") || lower.includes('without website')) &&
        (lower.includes('setup') || lower.includes('start') || lower.includes('sell')));

    if (asksStarterLink) {
      await trackMetric({ source: 'demo-assistant', event: 'starter_link_question' });
      const reply =
        `Yes—Starter Link is designed exactly for SBOs without a website.\n\n` +
        `You can share a single support link with customers, and TikoZap handles incoming questions in the same inbox workflow.\n\n` +
        `When you're ready, you can add the website widget later without changing your core setup.`;
      return jsonReply(reply, 'rule');
    }

    if (mentionsTikoZap && asksPlatformIntent) {
      await trackMetric({ source: 'demo-assistant', event: 'platform_intent_shortcut' });
      const reply =
        `TikoZap is an AI customer support platform for online stores.\n\n` +
        `It includes:\n` +
        `• A website chat widget (chat bubble)\n` +
        `• A Starter Link for SBOs without websites\n` +
        `• A Conversations inbox for staff (human takeover)\n` +
        `• A knowledge/policies area to train accurate store answers\n` +
        `• Onboarding steps like Store → Plan → Billing → Knowledge → Widget/Starter Link → Install → Test\n\n` +
        `This demo doesn’t connect to real orders—it's a safe preview of how the assistant and workflow behave.\n\n` +
        `What are you evaluating: features, pricing, or setup?`;

      return jsonReply(reply, 'rule');
    }

    // If somehow no user text, just return a platform-focused canned answer.
    if (!userText) {
      const reply = pickBucketReply(bucket);
      await trackMetric({ source: 'demo-assistant', event: 'empty_user_text' });
      return jsonReply(reply, 'canned');
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

    let replyFromModel: string | null = null;

    if (process.env.OPENAI_API_KEY) {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (wantsTranslation && lastAssistant) {
        // 🔤 Translation path
        const response = await client.responses.create({
          model: 'gpt-4.1-mini',
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
          model: 'gpt-4.1-mini',
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

    await trackMetric({
      source: 'demo-assistant',
      event: replyFromModel ? 'model_reply' : 'canned_reply',
      bucket: bucket ?? 'off_topic',
    });

    return jsonReply(reply, replyFromModel ? 'model' : 'canned');
  } catch (error) {
    console.error('Error in /api/demo-assistant', error);
    return jsonReply(FALLBACK_DEFAULT, 'canned');
  }
}
