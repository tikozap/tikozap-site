// src/lib/emmaNotebookEngine.ts

import 'server-only';

export type EmmaNotebookEntry = {
  id: string;
  category: string;
  title: string;
  summary: string;
  evidence: string;
  appliedCount: number;
};

export async function getNotebookEntries(): Promise<EmmaNotebookEntry[]> {
  return [
    {
      id: 'waterproof-notebook-demo',
      category: 'Product Knowledge',
      title: 'Explaining water-resistant vs waterproof',
      summary:
        'When customers ask whether a jacket is waterproof, explain the difference early: water-resistant is suitable for light rain, while waterproof means designed for prolonged exposure to water.',
      evidence:
        'This approach has helped customers understand the product more clearly after repeated use in customer conversations.',
      appliedCount: 47,
    },
  ];
}