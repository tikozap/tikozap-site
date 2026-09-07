// src/lib/voiceAgentPolicy.ts
export function looksLikeOrderStatusRequest(text: string): boolean {
  const t = (text || '').toLowerCase();

  // simple, practical heuristic
  const keywords = [
    'order',
    'status',
    'track',
    'tracking',
    'shipment',
    'shipping',
    'delivery',
    'where is my',
    'package',
    'arrive',
  ];

  if (keywords.some((k) => t.includes(k))) return true;

  // order number patterns like "#1234" or "order 1234"
  if (/#\s*\d{3,}/.test(t)) return true;
  if (/order\s*\d{3,}/.test(t)) return true;

  return false;
}

export function orderStatusCollectionReply(): string {
  // Keep it voice-friendly (1–2 sentences)
  return (
    "Sure — I can help with that. Please tell me your order number, or the email or phone number used at checkout."
  );
}