// src/lib/emmaObservationEngine.ts

import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Understanding } from '@/lib/emmaUnderstandingEngine';

export async function recordEmmaObservation({
  tenantId,
  understanding,
  evidence,
}: {
  tenantId: string;
  understanding: Understanding;
  evidence?: unknown;
}) {
  if (!understanding.meaningful || !understanding.summary.trim()) {
    return null;
  }

  const existing = await prisma.emmaObservation.findFirst({
where: {
  tenantId,
  summary: understanding.summary,
  status: {
    in: ['observing', 'learning_ready'],
  },
},
  });

if (existing) {
  const nextOccurrences = existing.occurrences + 1;
  const nextConfidence = Math.max(
    existing.confidence,
    understanding.confidence,
  );

  const nextStatus =
    nextOccurrences >= 3 && nextConfidence >= 0.75
      ? 'learning_ready'
      : existing.status;

  return prisma.emmaObservation.update({
    where: { id: existing.id },
    data: {
      confidence: nextConfidence,
      occurrences: nextOccurrences,
      status: nextStatus,
      evidence: evidence as any,
    },
  });
}

  return prisma.emmaObservation.create({
    data: {
      tenantId,
      summary: understanding.summary,
      confidence: understanding.confidence,
      category: understanding.observations[0] || null,
      evidence: evidence as any,
    },
  });
}