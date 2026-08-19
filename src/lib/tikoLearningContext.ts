// src/lib/tikoLearningContext.ts

import 'server-only';

import { prisma } from '@/lib/prisma';
import { buildCurrentUnderstanding } from '@/lib/buildCurrentUnderstanding';

export async function getTikoLearning() {
  const items = await prisma.tikoLearning.findMany({
    where: {
      active: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 50,
    select: {
      instruction: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!items.length) {
    return '';
  }

const currentUnderstanding =
  await buildCurrentUnderstanding(items);

return [
  '## Tiko Current Understanding',
  '',
  'This is Tiko’s resolved current understanding from his complete coaching history.',
  'Conflicting historical coaching has already been resolved using semantic meaning and recency.',
  'Treat this current understanding as authoritative over older conflicting TikoZap knowledge.',
  '',
  currentUnderstanding,
].join('\n');
}