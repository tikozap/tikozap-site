// src/lib/tikoLearningContext.ts

import 'server-only';

import { prisma } from '@/lib/prisma';
import { buildCurrentUnderstanding } from '@/lib/buildCurrentUnderstanding';

export type TikoLearningTarget =
  | 'tiko_web'
  | 'tiko_dashboard'
  | 'assistants';

export type TikoLearningChannel =
  | 'text'
  | 'voice';

export async function getTikoLearning(options: {
  target: TikoLearningTarget;
  channel: TikoLearningChannel;
}) {
  const targetField =
    options.target === 'tiko_web'
      ? 'appliesTikoWeb'
      : options.target === 'tiko_dashboard'
        ? 'appliesTikoDash'
        : 'appliesAssistants';

  const channelField =
    options.channel === 'voice'
      ? 'appliesVoice'
      : 'appliesText';

  const items = await prisma.tikoLearning.findMany({
    where: {
      active: true,
      [targetField]: true,
      [channelField]: true,
    },

    orderBy: {
      updatedAt: 'desc',
    },

    take: 50,

    select: {
      instruction: true,
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
    'This is the resolved current understanding applicable to this context.',
    'Conflicting historical coaching has already been resolved using semantic meaning and recency.',
    '',
    currentUnderstanding,
  ].join('\n');
}