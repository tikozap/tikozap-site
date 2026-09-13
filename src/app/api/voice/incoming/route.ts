// src/app/api/voice/incoming/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Twilio can keep calling /api/voice/incoming
export { POST } from '../../webhooks/twilio/voice/route';

// Friendly message in browser
export function GET() {
  return NextResponse.json({
    ok: true,
    hint: 'Use POST (Twilio Voice webhook).',
    canonical: '/api/webhooks/twilio/voice',
  });
}