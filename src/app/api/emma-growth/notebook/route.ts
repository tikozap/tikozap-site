// src/app/api/emma-growth/notebook/route.ts

import { NextResponse } from 'next/server';
import { getNotebookEntries } from '@/lib/emmaNotebookEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await getNotebookEntries();

  return NextResponse.json({
    ok: true,
    entries,
  });
}