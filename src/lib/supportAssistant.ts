export type SupportIntent =
  | 'returns'
  | 'shipping'
  | 'order_status'
  | 'sizing'
  | 'unknown';

export type SupportReplyResult = {
  intent: SupportIntent;
  reply: string;
  needsHuman: boolean;
};

function normalize(text: string): string {
  return (text || '').toLowerCase();
}

export function detectSupportIntent(customerText: string): SupportIntent {
  const text = normalize(customerText);

  if (text.includes('return')) return 'returns';
  if (text.includes('ship') || text.includes('delivery')) return 'shipping';
  if (text.includes('order') || text.includes('tracking')) return 'order_status';
  if (text.includes('xl') || text.includes('size') || text.includes('fit')) return 'sizing';

  return 'unknown';
}

export function buildSupportReply(customerText: string): SupportReplyResult {
  const intent = detectSupportIntent(customerText);

  if (intent === 'returns') {
    return {
      intent,
      needsHuman: false,
      reply:
        'Returns are accepted within 30 days if items are unworn with tags. Want me to outline the return steps?',
    };
  }

  if (intent === 'shipping') {
    return {
      intent,
      needsHuman: false,
      reply:
        'Orders ship in 1–2 business days. Typical US delivery is 3–7 business days. What’s your ZIP code?',
    };
  }

  if (intent === 'order_status') {
    return {
      intent,
      needsHuman: false,
      reply:
        'I can help—please share your order number and the email used at checkout so I can check the status.',
    };
  }

  if (intent === 'sizing') {
    return {
      intent,
      needsHuman: false,
      reply:
        'I can help with sizing. Which item are you looking at, and what size do you usually wear?',
    };
  }

  return {
    intent: 'unknown',
    needsHuman: true,
    reply:
      "I want to make sure we get this right. I'm flagging this for a support teammate. Please share your email and order number (if relevant), and we will follow up shortly.",
  };
}
