// src/app/api/emma-growth/learning/route.ts

import { NextResponse } from 'next/server';
import { getLearningReadyCards } from '@/lib/emmaLearningEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const tenantId = 'test-tenant';

  const cards = await getLearningReadyCards({ tenantId });

  return NextResponse.json({
    ok: true,
    cards,
  });
}