// src/lib/emmaContextBuilder.ts

import type { ConversationTurn } from '@/lib/emmaGrowthEngine';
import type { UnderstandingContext } from '@/lib/emmaUnderstandingEngine';

export type BuildEmmaContextInput = {
  conversation: ConversationTurn[];
  storeKnowledge?: string[];
  customerUnderstanding?: string[];
  merchantGuidance?: string[];
};

export function buildEmmaContext(input: BuildEmmaContextInput): UnderstandingContext {
  return {
    conversation: input.conversation.map((turn) => {
      const speaker =
        turn.role === 'customer'
          ? 'Customer'
          : turn.role === 'assistant'
            ? 'Emma'
            : 'Merchant';

      return `${speaker}: ${turn.content}`;
    }),
    storeKnowledge: input.storeKnowledge || [],
    customerUnderstanding: input.customerUnderstanding || [],
    merchantGuidance: input.merchantGuidance || [],
  };
}