// src/app/api/widget/test/route.ts

import { NextResponse } from 'next/server';
import { getAuthedUserAndTenant } from '@/lib/auth';
import { runTikoBrain } from '@/lib/brain';
import { resolveProductProvider } from '@/lib/resolveProductProvider';
import {
  getAssistantIdentity,
  getAssistantLearning,
  getStoreKnowledge,
} from '@/lib/assistantContext';
import {
  getTenantEntitlement,
  TRIAL_PAUSED_MERCHANT_MESSAGE,
} from '@/lib/tenantEntitlement';
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = 'nodejs';

type TestHistoryMessage = {
  role: 'customer' | 'assistant';
  content: string;
};

function normalize(value: unknown) {
  return String(value || '').trim();
}

function normalizeHistory(value: unknown): TestHistoryMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): TestHistoryMessage | null => {
      const role =
        item?.role === 'assistant'
          ? 'assistant'
          : item?.role === 'customer'
            ? 'customer'
            : null;

      const content = normalize(item?.content);

      if (!role || !content) return null;

      return {
        role,
        content,
      };
    })
    .filter((item): item is TestHistoryMessage => Boolean(item))
    .slice(-12);
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

    const text = normalize(body?.text);
    const history = normalizeHistory(body?.history);

    if (!text) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing text',
        },
        {
          status: 400,
        }
      );
    }

    const tenantId = auth.tenant.id;

    const entitlement = await getTenantEntitlement(tenantId);

if (!entitlement.ok) {
  return NextResponse.json(
    {
      ok: false,
      reason: 'TRIAL_EXPIRED',
      error: TRIAL_PAUSED_MERCHANT_MESSAGE,
    },
    { status: 402 }
  );
}

    const [assistantIdentity, assistantLearning, productProvider] =
      await Promise.all([
        getAssistantIdentity(tenantId),
        getAssistantLearning(tenantId),
        resolveProductProvider(tenantId),
      ]);

    const storeKnowledge = await getStoreKnowledge(
      tenantId,
      assistantIdentity.name
    );

    const result = await runTikoBrain({
      message: text,
      history,
      storeKnowledge,
      assistantLearning,
      productProvider,
    });

    return NextResponse.json({
      ok: true,
      reply: result.reply,
      products: result.products || [],
      assistantName: assistantIdentity.name,
    });
  } catch (error: any) {
    console.error('[widget-test]', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Could not test widget.',
      },
      {
        status: 500,
      }
    );
  }
}