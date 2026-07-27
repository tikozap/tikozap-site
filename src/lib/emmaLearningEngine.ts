// src/lib/emmaLearningEngine.ts

import 'server-only';
import { prisma } from '@/lib/prisma';

export type EmmaLearningCard = {
  id: string;
  title: string;
  message: string;
  currentUnderstanding: string;
  question: string;
  occurrences: number;
  confidence: number;
};

export async function getLearningReadyCards({
  tenantId,
}: {
  tenantId: string;
}): Promise<EmmaLearningCard[]> {
  const observations = await prisma.emmaObservation.findMany({
    where: {
      tenantId,
      status: 'learning_ready',
    },
    orderBy: {
      lastSeen: 'desc',
    },
    take: 10,
  });

return observations.map((observation) => ({
  id: observation.id,
  title: "I'd like to check my understanding with you.",
  message:
    'After several customer conversations, I think I may be seeing an important pattern.',
  currentUnderstanding: observation.summary,
  question: 'Am I understanding your business correctly?',
  occurrences: observation.occurrences,
  confidence: observation.confidence,
}));
}