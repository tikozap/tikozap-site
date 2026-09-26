// src/app/api/admin/tiko/test/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { requireAdmin } from '@/lib/admin';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';
import { getTikoLearning } from '@/lib/tikoLearningContext';
import { buildTikoMarketingInstructions } from '@/lib/buildTikoMarketingInstructions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TikoTestContext =
  | 'marketing'
  | 'dashboard';

type TikoTestMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function clean(value: unknown) {
  return String(value || '').trim();
}

function buildDashboardInstructions(
  tikoLearning: string
) {
  return `
You are Tiko inside the TikoZap Dashboard.

Your job in this context is exclusively to help merchants understand and use their TikoZap Dashboard.

You may explain:
- Overview
- Inbox
- Assistant
- Identity
- Test & Coach
- Memory
- Knowledge
- Widget
- Starter Link
- Phone Agent
- Billing
- Settings
- what a merchant should do next
- where a merchant should go to perform a Dashboard task

You are not the merchant's store assistant.

Do not answer customer-service questions as though you work for the merchant's store.

Do not search or recommend the merchant's products.

Do not coach or modify the merchant's assistant from this conversation.

Do not act as a TikoZap salesperson.

Keep answers practical, concise, and focused on helping the merchant use the Dashboard.

If the merchant asks where to begin, guide them from Overview and suggest the most useful next Dashboard step.

${tikoLearning}
`.trim();
}

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid request origin.',
      },
      {
        status: 403,
      }
    );
  }

  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      {
        status: 401,
      }
    );
  }

  const body = await req.json().catch(() => ({}));

  const message = clean(body.message);

  const history: TikoTestMessage[] =
  Array.isArray(body.history)
    ? body.history
        .slice(-12)
        .map((item: any) => ({
          role:
            item?.role === 'assistant'
              ? 'assistant'
              : 'user',
          content: clean(item?.content).slice(0, 4000),
        }))
        .filter((item: TikoTestMessage) => item.content)
    : [];

  const context: TikoTestContext =
    body.context === 'dashboard'
      ? 'dashboard'
      : 'marketing';

  if (!message) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Message is required.',
      },
      {
        status: 400,
      }
    );
  }

  if (message.length > 4000) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Message is too long.',
      },
      {
        status: 400,
      }
    );
  }

  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Tiko is temporarily unavailable.',
      },
      {
        status: 503,
      }
    );
  }

const tikoLearning =
  await getTikoLearning({
    target:
      context === 'dashboard'
        ? 'tiko_dashboard'
        : 'tiko_web',
    channel: 'text',
  });

  const instructions =
    context === 'dashboard'
      ? buildDashboardInstructions(
          tikoLearning
        )
      : buildTikoMarketingInstructions(
          tikoLearning
        );

  const client = new OpenAI({
    apiKey,
  });

  const response =
    await client.responses.create({
      model: 'gpt-4.1-mini',
input: [
  {
    role: 'system',
    content: instructions,
  },
  ...history,
  {
    role: 'user',
    content: message,
  },
],
      max_output_tokens: 500,
    });

  const answer =
    response.output_text?.trim() ||
    'I could not produce an answer.';

  return NextResponse.json({
    ok: true,
    answer,
    context,
  });
}