// src/app/api/emma-growth/test/route.ts

import { NextResponse } from 'next/server';
import { buildEmmaContext } from '@/lib/emmaContextBuilder';
import { understandConversation } from '@/lib/emmaUnderstandingEngine';
import { recordEmmaObservation } from '@/lib/emmaObservationEngine';
import { getLearningReadyCards } from '@/lib/emmaLearningEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const sampleConversation = [
    {
      role: 'customer' as const,
      content: "Hi, I'm looking at this jacket. Is it waterproof?",
    },
    {
      role: 'assistant' as const,
      content:
        "It's water-resistant, which means it can handle light rain, but it is not designed for heavy rain.",
    },
    {
      role: 'customer' as const,
      content:
        "Got it. Also, I'm between Medium and Large. Which size should I choose?",
    },
    {
      role: 'assistant' as const,
      content:
        'If you are between sizes, I recommend checking the size chart and choosing based on your preferred fit.',
    },
  ];

  const context = buildEmmaContext({
    conversation: sampleConversation,
    storeKnowledge: [
      'The jacket is water-resistant, not fully waterproof.',
      'Customers should check the size chart when between sizes.',
    ],
    customerUnderstanding: [
      'This customer appears to compare details carefully before buying.',
    ],
    merchantGuidance: [
      'Be honest about product limitations. Do not overpromise waterproof protection.',
    ],
  });

  const understanding = await understandConversation(context);

const observation = await recordEmmaObservation({
  tenantId: 'test-tenant',
  understanding,
  evidence: {
    source: 'emma-growth-test',
    conversation: sampleConversation,
  },
});

const learningCards = await getLearningReadyCards({
  tenantId: 'test-tenant',
});

return NextResponse.json({
  ok: true,
  context,
  understanding,
  observation,
  learningCards,
});
}