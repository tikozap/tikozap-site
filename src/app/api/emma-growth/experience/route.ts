// src/app/api/emma-growth/experience/route.ts

import { NextResponse } from 'next/server';
import { getExperienceCards } from '@/lib/emmaExperienceEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cards = await getExperienceCards();

  return NextResponse.json({
    ok: true,
    cards,
  });
}