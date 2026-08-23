// src/lib/tikoLearningContext.ts

import 'server-only';

import { prisma } from '@/lib/prisma';

import { buildCurrentUnderstanding } from '@/lib/buildCurrentUnderstanding';

export type TikoLearningAudience =
  | 'tiko'
  | 'all_assistants';

export type TikoLearningContext =
  | 'everywhere'
  | 'marketing'
  | 'dashboard';

export type TikoLearningChannel =
  | 'all'
  | 'voice'
  | 'text';

export type GetTikoLearningOptions = {
  audience?: TikoLearningAudience;
  context?: TikoLearningContext;
  channel?: TikoLearningChannel;
};

export async function getTikoLearning(
  options: GetTikoLearningOptions = {}
) {
  const audience =
    options.audience || 'tiko';

  const context =
    options.context || 'everywhere';

  const channel =
    options.channel || 'all';

  const applicableAudiences =
    audience === 'tiko'
      ? ['tiko', 'all_assistants']
      : ['all_assistants'];

  const applicableContexts =
    context === 'everywhere'
      ? ['everywhere']
      : ['everywhere', context];

  const applicableChannels =
    channel === 'all'
      ? ['all']
      : ['all', channel];

  const items = await prisma.tikoLearning.findMany({
    where: {
      active: true,

      audience: {
        in: applicableAudiences,
      },

      context: {
        in: applicableContexts,
      },

      channel: {
        in: applicableChannels,
      },
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
    'This is the resolved current understanding applicable to this TikoZap context.',
    'Conflicting historical coaching has already been resolved using semantic meaning and recency.',
    'Treat this current understanding as authoritative over older conflicting TikoZap knowledge.',
    '',
    currentUnderstanding,
  ].join('\n');
}
