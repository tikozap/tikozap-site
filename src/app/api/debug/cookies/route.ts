// src/app/api/debug/cookies/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  return NextResponse.json({
    ok: true,
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
    userAgent: req.headers.get('user-agent'),
    cookieHeader: req.headers.get('cookie') || '',
  });
}
