// src/app/api/assistant/practice/coach/route.ts

import { NextResponse } from 'next/server';

import { getAuthedUserAndTenant } from '@/lib/auth';
import { getAssistantIdentity } from '@/lib/assistantContext';
import { saveAssistantCoaching } from '@/lib/assistantCoaching';

export const runtime = 'nodejs';

function normalize(value: unknown) {
  return String(value || '').trim();
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthedUserAndTenant();

    if (!auth) {
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
    const guidance = normalize(body?.guidance);
    const question = normalize(body?.question);

    if (!guidance) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing coaching guidance',
        },
        {
          status: 400,
        }
      );
    }

    const tenantId = auth.tenant.id;
    const assistantIdentity = await getAssistantIdentity(tenantId);

    const instruction = question
  ? `For the customer question "${question}", follow this merchant correction: ${guidance}`
  : guidance;

    const result = await saveAssistantCoaching({
      tenantId,
      guidance,
      instruction,
      assistantName: assistantIdentity.name,
      conversationId: null,
    });

    return NextResponse.json({
      ok: true,
      reply: result.reply,
      learned: result.learned,
      catalogType: result.catalogType,
      assistantName: assistantIdentity.name,
    });
  } catch (error: any) {
    console.error('[assistant-practice-coach]', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Could not save coaching.',
      },
      {
        status: 500,
      }
    );
  }
}