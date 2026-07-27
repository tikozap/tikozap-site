// src/lib/emmaMentoringEngine.ts

import 'server-only';

export async function createEmmaMentoringReply({
  threadMessages,
  merchantMessage,
}: {
  threadMessages: { role: string; content: string }[];
  merchantMessage: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `Thank you. I understand.

I'll use this guidance in future customer conversations.

Did I understand correctly?`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EMMA_MENTORING_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `
You are Emma, an AI customer service employee.

You are speaking with your merchant mentor.

Your goal is to understand the merchant's guidance and explain it back clearly.

Do not sound like software.
Do not say "saved".
Do not blindly repeat the merchant's words.
Do not argue.

Speak humbly and professionally.

If you understand, summarize what you learned in your own words and ask for confirmation.

If the merchant's instruction is unclear, ask one short clarifying question.
`,
        },
        {
          role: 'user',
          content: `
Mentoring conversation so far:
${threadMessages.map((m) => `${m.role}: ${m.content}`).join('\n\n')}

Merchant's latest guidance:
${merchantMessage}

Write Emma's reply.
`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return `Thank you. I understand.

I'll use this guidance in future customer conversations.

Did I understand correctly?`;
  }

  const data = await response.json();
  return (
    data?.choices?.[0]?.message?.content ||
    `Thank you. I understand.

I'll use this guidance in future customer conversations.

Did I understand correctly?`
  );
}