// src/lib/buildCurrentUnderstanding.ts

import 'server-only';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type LearningHistoryItem = {
  instruction: string;
  updatedAt: Date;
};

export async function buildCurrentUnderstanding(
  items: LearningHistoryItem[]
): Promise<string> {
  if (!items.length) {
    return '';
  }

  const ordered = [...items].sort(
    (a, b) =>
      b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  // Safe fallback if OpenAI is unavailable:
  // preserve the existing newest-first behavior.
  if (!process.env.OPENAI_API_KEY) {
    return ordered
      .map(
        (item, index) =>
          `${index + 1}. [${item.updatedAt.toISOString()}] ${item.instruction.trim()}`
      )
      .join('\n');
  }

  try {
    const response = await openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL_SUPPORT ||
        'gpt-4o-mini',

      temperature: 0,

      response_format: {
        type: 'json_object',
      },

      messages: [
        {
          role: 'system',
          content:
            `You are an Understanding Engine for an AI employee.\n\n` +
            `You receive the employee's complete learning history, ordered newest to oldest.\n\n` +
            `Your job is to produce the employee's CURRENT UNDERSTANDING.\n\n` +
            `Rules:\n` +
            `1. Understand meaning semantically. Do not group notes merely because they share words.\n` +
            `2. Notes about different subjects must coexist.\n` +
            `3. Complementary notes about the same subject must coexist.\n` +
            `4. Two notes conflict only when they concern the same underlying fact, policy, preference, recommendation, or behavior and cannot logically both be true.\n` +
            `5. When notes truly conflict, the note with the newest updatedAt timestamp is authoritative.\n` +
            `6. An edited note is newer because updatedAt changes.\n` +
            `7. Do not invent facts that were not taught.\n` +
            `8. Preserve all important concrete details such as prices, quantities, dates, product names, limits, and policies.\n` +
            `9. Rewrite command-style coaching into clear current knowledge when useful. For example, "Change Voice Pro to $29 for 350 minutes" becomes "Voice Pro costs $29 for 350 minutes."\n` +
            `10. Return only the current understanding. Historical conflicting facts must not appear.\n\n` +
            `Return JSON only in this exact shape:\n` +
            `{"currentUnderstanding":["fact 1","fact 2"]}`,
        },
        {
          role: 'user',
          content: JSON.stringify(
            ordered.map((item) => ({
              updatedAt: item.updatedAt.toISOString(),
              instruction: item.instruction.trim(),
            }))
          ),
        },
      ],
    });

    const raw =
      response.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      throw new Error(
        'Understanding Engine returned no content.'
      );
    }

    const parsed = JSON.parse(raw);

    const currentUnderstanding = Array.isArray(
      parsed?.currentUnderstanding
    )
      ? parsed.currentUnderstanding
          .map((value: unknown) =>
            String(value || '').trim()
          )
          .filter(Boolean)
      : [];

    if (!currentUnderstanding.length) {
      throw new Error(
        'Understanding Engine returned no current understanding.'
      );
    }

    return currentUnderstanding
      .map(
        (instruction: string, index: number) =>
          `${index + 1}. ${instruction}`
      )
      .join('\n');
  } catch (error) {
    console.error(
      '[Understanding Engine] failed:',
      error
    );

    // Fail safely: never lose coaching because
    // understanding resolution failed.
    return ordered
      .map(
        (item, index) =>
          `${index + 1}. [${item.updatedAt.toISOString()}] ${item.instruction.trim()}`
      )
      .join('\n');
  }
}