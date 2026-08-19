// src/lib/assistantCoaching.ts

import OpenAI from 'openai';

import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SaveAssistantCoachingInput = {
  tenantId: string;
  guidance: string;
  instruction?: string;
  assistantName: string;
  conversationId?: string | null;
  source?: string;
};

export type SaveAssistantCoachingResult = {
  reply: string;
  learned: boolean;
  catalogType: string | null;
  learningId: string | null;
};

function normalize(value: unknown) {
  return String(value || '').trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractConcreteMarkers(value: string) {
  const text = value.toLowerCase();

  const markers = [
    ...(text.match(/\$\s*\d+(?:[.,]\d+)?/g) || []),
    ...(text.match(/\b\d+(?:[.,]\d+)?\s*%/g) || []),
    ...(text.match(/\b\d+(?:[.,]\d+)?\b/g) || []),
    ...(text.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g
    ) || []),
    ...(text.match(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g
    ) || []),
    ...(text.match(
      /\b(today|tomorrow|yesterday|tonight)\b/g
    ) || []),
  ];

  return new Set(
    markers.map((marker) =>
      marker.replace(/\s+/g, '').trim()
    )
  );
}

function introducesNewConcreteFacts(
  original: string,
  candidate: string
) {
  const originalMarkers =
    extractConcreteMarkers(original);

  const candidateMarkers =
    extractConcreteMarkers(candidate);

  for (const marker of candidateMarkers) {
    if (!originalMarkers.has(marker)) {
      return true;
    }
  }

  return false;
}

function detectCatalogFactCoaching(guidance: string): string | null {
  const text = guidance.toLowerCase();

  const assignsValue =
    /\b(change|set|make|update|rename|replace)\b/.test(text) ||
    /\bis now\b/.test(text) ||
    /\bto\b/.test(text) ||
    /\$\s*\d/.test(text);

  if (!assignsValue) return null;

if (
  /\b(price|cost|sale price|discount price|compare at)\b/.test(text)
) {
  return 'price';
}

  if (
    /\b(stock|inventory|quantity|qty|in stock|out of stock|available)\b/.test(
      text
    )
  ) {
    return 'inventory';
  }

  if (/\b(sku|variant|option|size|color)\b/.test(text)) {
    return 'variant';
  }

  if (/\b(product name|title|rename product)\b/.test(text)) {
    return 'product';
  }

  return null;
}

export async function generateLearningAcknowledgement(
  guidance: string,
  assistantName: string
) {
  const clean = normalize(guidance);
  const safeName = normalize(assistantName) || 'Store Assistant';

if (!clean || clean.length < 8) {
  return `${safeName} noted:\n\n${clean}`;
}

if (!process.env.OPENAI_API_KEY) {
  return `${safeName} noted:\n\n${clean}`;
}

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_SUPPORT || 'gpt-4o-mini',
      temperature: 0.25,
      max_tokens: 90,
      messages: [
        {
          role: 'system',
content:
  `You are ${safeName}, a confident store assistant. ` +
  `Your manager has just coached you. Briefly confirm exactly what you learned. ` +
  `Preserve every important concrete fact, including numbers, dates, time periods, ` +
  `prices, product names, and policy details. Do not make the instruction vague or generic. ` +
  `Do not add new information. Do not apologize. Keep it under 50 words. ` +
  `Start with "${safeName} noted:" followed by a blank line.`,
        },
        {
          role: 'user',
          content: clean,
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    const prefix = `${safeName} noted:`;

if (text) {
  const candidate = text
    .replace(
      new RegExp(
        `^${escapeRegExp(prefix)}\\s*`,
        'i'
      ),
      ''
    )
    .trim();

  if (
    introducesNewConcreteFacts(
      clean,
      candidate
    )
  ) {
    console.warn(
      '[Learning acknowledgement] rejected unsupported concrete detail:',
      {
        original: clean,
        candidate,
      }
    );

    return `${prefix}\n\n${clean}`;
  }

  return `${prefix}\n\n${candidate}`;
}
  } catch (error) {
    console.error('[Assistant coaching acknowledgement] failed:', error);
  }

return `${safeName} noted:\n\n${clean}`;
}

export async function saveAssistantCoaching({
  tenantId,
  guidance,
  instruction,
  assistantName,
  conversationId = null,
  source = 'merchant_coaching',
}: SaveAssistantCoachingInput): Promise<SaveAssistantCoachingResult> {

  const cleanGuidance = normalize(guidance);
const cleanInstruction =
  normalize(instruction) || cleanGuidance;
  const safeAssistantName =
    normalize(assistantName).slice(0, 80) || 'Store Assistant';

  if (!tenantId) {
    throw new Error('Missing tenant');
  }

  if (!cleanGuidance) {
    throw new Error('Missing coaching guidance');
  }

  const catalogType = detectCatalogFactCoaching(cleanInstruction);

  if (catalogType) {
return {
  reply:
    `${safeAssistantName} noted:\n\n` +
    `I'll always use the latest ${catalogType} information directly from your Shopify catalog. ` +
    `Any ${catalogType} changes you make in Shopify will be reflected automatically.`,
  learned: false,
  catalogType,
  learningId: null,
};
  }

const reply = await generateLearningAcknowledgement(
  cleanInstruction,
  safeAssistantName
);

  const summary = reply
    .replace(
      new RegExp(
        `^${escapeRegExp(safeAssistantName)} noted:\\s*`,
        'i'
      ),
      ''
    )
    .trim();

 const learning = await prisma.assistantLearning.create({
    data: {
      tenantId,
      conversationId: conversationId || null,
      instruction: cleanInstruction,
      summary,
      source,
      active: true,
    },
  });

return {
  reply,
  learned: true,
  catalogType: null,
  learningId: learning.id,
};
}