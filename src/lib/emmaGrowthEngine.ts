// src/lib/emmaGrowthEngine.ts

export type GrowthObservation = {
  id: string;
  type: 'product_question' | 'customer_behavior' | 'service_pattern';
  subject: string;
  summary: string;
  evidence: string[];
  confidence: number;
};

export type ConversationTurn = {
  role: 'customer' | 'assistant' | 'merchant';
  content: string;
};

export function observeConversation(turns: ConversationTurn[]): GrowthObservation[] {
  const text = turns.map((t) => t.content.toLowerCase()).join(' ');

  const observations: GrowthObservation[] = [];

  if (text.includes('waterproof') || text.includes('water resistant')) {
    observations.push({
      id: 'waterproof-confusion',
      type: 'product_question',
      subject: 'Waterproof questions',
      summary:
        'Customers may be unsure whether water-resistant products are fully waterproof.',
      evidence: turns.map((t) => t.content).slice(-4),
      confidence: 0.35,
    });
  }

  if (text.includes('size') || text.includes('medium') || text.includes('large')) {
    observations.push({
      id: 'sizing-guidance',
      type: 'service_pattern',
      subject: 'Sizing guidance',
      summary:
        'Customers may need extra sizing help before choosing apparel.',
      evidence: turns.map((t) => t.content).slice(-4),
      confidence: 0.35,
    });
  }

  if (text.includes('gift') || text.includes('birthday')) {
    observations.push({
      id: 'gift-shopper',
      type: 'customer_behavior',
      subject: 'Gift shopping',
      summary:
        'This customer may be shopping for gifts and may care more about delivery timing.',
      evidence: turns.map((t) => t.content).slice(-4),
      confidence: 0.3,
    });
  }

  return observations;
}