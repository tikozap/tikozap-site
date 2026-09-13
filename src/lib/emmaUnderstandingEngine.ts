// src/lib/emmaUnderstandingEngine.ts

import 'server-only';

export type UnderstandingContext = {
  conversation: string[];
  storeKnowledge: string[];
  customerUnderstanding: string[];
  merchantGuidance: string[];
};

export type Understanding = {
  meaningful: boolean;
  summary: string;
  observations: string[];
  customerInsights: string[];
  suggestedLearning: string[];
  confidence: number;
};

const EMPTY_UNDERSTANDING: Understanding = {
  meaningful: false,
  summary: 'Nothing meaningful yet.',
  observations: [],
  customerInsights: [],
  suggestedLearning: [],
  confidence: 0,
};

function buildUnderstandingPrompt(context: UnderstandingContext) {
  return `
You are helping Emma reflect on a completed customer conversation.

Important:
- Do not answer the customer.
- Do not create rules.
- Do not overreact to one conversation.
- Only identify meaningful understanding that could help future customer service.
- If nothing meaningful was learned, return meaningful=false.

Conversation:
${context.conversation.join('\n')}

Store Knowledge:
${context.storeKnowledge.length ? context.storeKnowledge.join('\n') : 'None provided.'}

Customer Understanding:
${context.customerUnderstanding.length ? context.customerUnderstanding.join('\n') : 'None yet.'}

Merchant Guidance:
${context.merchantGuidance.length ? context.merchantGuidance.join('\n') : 'None yet.'}

Return only valid JSON with this shape:

{
  "meaningful": boolean,

  "summary": string,

  "observations": string[],

  "customerInsights": string[],

  "suggestedLearning": string[],

  "confidence": number
}

Important:

The "summary" is the most important field.

Do NOT summarize what Emma said.

Do NOT summarize the conversation.

Instead, summarize Emma's current understanding of the underlying customer pattern.

Good example:

"Customers asking about waterproofing are often trying to understand the difference between water-resistant and waterproof."

Bad example:

"Emma explained that the jacket is water-resistant."

The summary should represent an understanding that Emma wants the merchant to validate.
`;
}

function safeParseUnderstanding(text: string): Understanding {
  try {
    const parsed = JSON.parse(text);

    return {
      meaningful: Boolean(parsed.meaningful),
      summary:
        typeof parsed.summary === 'string'
          ? parsed.summary
          : EMPTY_UNDERSTANDING.summary,
      observations: Array.isArray(parsed.observations)
        ? parsed.observations.filter((x: unknown) => typeof x === 'string')
        : [],
      customerInsights: Array.isArray(parsed.customerInsights)
        ? parsed.customerInsights.filter((x: unknown) => typeof x === 'string')
        : [],
      suggestedLearning: Array.isArray(parsed.suggestedLearning)
        ? parsed.suggestedLearning.filter((x: unknown) => typeof x === 'string')
        : [],
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0,
    };
  } catch {
    return EMPTY_UNDERSTANDING;
  }
}

export async function understandConversation(
  context: UnderstandingContext,
): Promise<Understanding> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[Emma Understanding] Missing OPENAI_API_KEY');
    return EMPTY_UNDERSTANDING;
  }

  const model =
    process.env.EMMA_UNDERSTANDING_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `
You are ChatGPT.

You are the permanent intelligence behind Emma, the AI employee working for this merchant.

Your responsibility is not to answer the customer.

Your responsibility is to reflect on the completed conversation and determine whether Emma gained any meaningful understanding that could improve future customer service.

TikoZap provides context.

You provide understanding.

Do not invent facts.

Do not create unnecessary observations.

If nothing meaningful was learned, say so.
`,
        },
        {
          role: 'user',
          content: buildUnderstandingPrompt(context),
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    console.error(
  '[Emma Understanding] OpenAI request failed',
  response.status
);
    return EMPTY_UNDERSTANDING;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    return EMPTY_UNDERSTANDING;
  }

  return safeParseUnderstanding(content);
}