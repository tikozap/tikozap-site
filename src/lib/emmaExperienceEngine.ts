// src/lib/emmaExperienceEngine.ts

import 'server-only';

import { prisma } from '@/lib/prisma';

export type EmmaExperienceCard = {
  id: string;
  title: string;
  message: string;
  result: string;
  question: string;
  appliedCount: number;
};

export async function getExperienceCards({
  tenantId = 'test-tenant',
}: {
  tenantId?: string;
} = {}): Promise<EmmaExperienceCard[]> {
  const threads = await prisma.mentoringThread.findMany({
    where: {
      tenantId,
      status: 'confirmed',
      experienceReady: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  return threads.map((thread) => {
    const lastEmmaMessage =
      [...thread.messages].reverse().find((m) => m.role === 'emma')?.content ||
      'I have been using this understanding in customer conversations.';

    return {
      id: thread.id,
      title: "I'd like to share something I've learned.",
      message:
        'Since you helped me with this understanding, I have been using it in customer conversations.',
      result: lastEmmaMessage,
      question: 'Would you change anything about how I am handling this?',
      appliedCount: thread.appliedCount,
    };
  });
}