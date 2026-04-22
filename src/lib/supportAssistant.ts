// src/lib/supportAssistant.ts

export type SupportIntent =
  | 'returns'
  | 'shipping'
  | 'order_status'
  | 'sizing'
  | 'pricing'
  | 'setup_no_website'
  | 'setup_widget_install'
  | 'human'
  | 'unknown';

export type SupportReplyResult = {
  intent: SupportIntent;
  reply: string;
  needsHuman: boolean;
};

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Lightweight, deterministic intent detection.
 * (No AI calls here — fast + safe.)
 */
export function detectSupportIntent(customerText: string): SupportIntent {
  const text = normalize(customerText);

  // Explicit "human" / escalation signals
  if (
    text.includes('human') ||
    text.includes('agent') ||
    text.includes('representative') ||
    text.includes('someone') && text.includes('call') ||
    text.includes('talk to') ||
    text.includes('phone') ||
    text.includes('support team')
  ) {
    return 'human';
  }

  // No-website / starter link setup
  if (
    text.includes('no website') ||
    text.includes("don't have a website") ||
    text.includes('dont have a website') ||
    text.includes('without website') ||
    text.includes('starter link') ||
    text.includes('link in bio') ||
    text.includes('instagram') ||
    text.includes('tiktok') ||
    text.includes('qr') ||
    text.includes('qr code')
  ) {
    return 'setup_no_website';
  }

  // Widget install / embed
  if (
    text.includes('install') ||
    text.includes('embed') ||
    text.includes('snippet') ||
    text.includes('script') ||
    text.includes('code') && (text.includes('website') || text.includes('shopify')) ||
    text.includes('shopify') ||
    text.includes('wordpress') ||
    text.includes('wix') ||
    text.includes('squarespace')
  ) {
    return 'setup_widget_install';
  }

  // Pricing
  if (
    text.includes('price') ||
    text.includes('pricing') ||
    text.includes('cost') ||
    text.includes('how much') ||
    text.includes('plan')
  ) {
    return 'pricing';
  }

  // Core commerce intents
  if (text.includes('return') || text.includes('refund') || text.includes('exchange')) return 'returns';
  if (text.includes('ship') || text.includes('delivery') || text.includes('arrive') || text.includes('eta')) return 'shipping';
  if (text.includes('order') || text.includes('tracking') || text.includes('track') || text.includes('status')) return 'order_status';
  if (text.includes('xl') || text.includes('xs') || text.includes('size') || text.includes('fit') || text.includes('sizing')) return 'sizing';

  return 'unknown';
}

export function buildSupportReply(customerText: string): SupportReplyResult {
  const text = normalize(customerText);
  const intent = detectSupportIntent(text);

  // Small “tone” variations to prevent repetition
  const hello = pick([
    'Sure — ',
    'Got it — ',
    'Happy to help. ',
    'Absolutely. ',
    '',
  ]);

  if (intent === 'returns') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}Returns are usually accepted within 30 days as long as items are unworn and still have tags. Do you want the quick step-by-step for starting a return?`,
        `${hello}We can help with returns. Typically it’s within 30 days (unworn + tags). Was this a return or an exchange?`,
        `${hello}Returns are generally available within 30 days for unworn items with tags. If you tell me your order number, I can point you to the fastest next step.`,
      ]),
    };
  }

  if (intent === 'shipping') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}Most orders ship in 1–2 business days. Typical US delivery is about 3–7 business days after it ships. What ZIP code are you shipping to?`,
        `${hello}Shipping time depends on location, but a common range is 3–7 business days (US) after dispatch. If you share your ZIP code, I can give a tighter estimate.`,
        `${hello}We usually dispatch within 1–2 business days. Where are you located (ZIP or city/state) so I can estimate delivery?`,
      ]),
    };
  }

  if (intent === 'order_status') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}I can check that. Please send your order number and the email used at checkout.`,
        `${hello}No problem — what’s the order number (and the checkout email) so I can look up the status?`,
        `${hello}I can help with tracking/status. Share your order number and checkout email and I’ll guide you to the next step.`,
      ]),
    };
  }

  if (intent === 'sizing') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}I can help with sizing. Which item are you looking at, and what size do you usually wear?`,
        `${hello}Sizing help: tell me the item name and your usual size (and if you prefer a relaxed or fitted look).`,
        `${hello}Sure — what product is it, and what’s your typical size in similar brands?`,
      ]),
    };
  }

  if (intent === 'pricing') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}Pricing is listed on our Pricing page. If you tell me your store size (messages per month), I can suggest the best plan.`,
        `${hello}You can see current plans on the Pricing page. Are you starting with the “No Website Needed” Starter Link or installing on a website?`,
        `${hello}Plans and pricing are on the Pricing page. What are you trying to accomplish (website chat, Starter Link, or both)?`,
      ]),
    };
  }

  if (intent === 'setup_no_website') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}You can set up TikoZap even without a website using our Starter Link (“No Website Needed”). You’ll get a shareable chat page you can put in your bio or send to customers. Want to use it for Instagram/TikTok or for QR codes in-store?`,
        `${hello}No website is totally fine. Use the Starter Link (“No Website Needed”) — it’s a hosted chat page you can share anywhere (bio, DMs, SMS, QR). If you tell me where customers find you (IG, TikTok, marketplace), I’ll recommend the best setup.`,
        `${hello}Yes — you don’t need a site. Starter Link gives you a link customers can open to chat instantly. Do you want it mainly for link-in-bio, or for a QR code on packaging/in-store?`,
      ]),
    };
  }

  if (intent === 'setup_widget_install') {
    return {
      intent,
      needsHuman: false,
      reply: pick([
        `${hello}To install the website widget, you paste a small script snippet into your site (or use a platform integration like Shopify). What platform are you on — Shopify, Wix, WordPress, or something else?`,
        `${hello}Widget install is quick: add the script snippet to your site and the bubble appears. Which website platform are you using?`,
        `${hello}I can guide the install. Tell me your platform (Shopify/Wix/WordPress/Squarespace) and I’ll give the exact steps.`,
      ]),
    };
  }

  if (intent === 'human') {
    return {
      intent,
      needsHuman: true,
      reply: pick([
        `${hello}No problem — I can loop in a human teammate. What’s the best email to reach you, and what’s the quickest summary of the issue?`,
        `${hello}Got it. I’ll flag this for a support teammate. Please share your email and (if it’s about an order) your order number.`,
        `${hello}Understood — we’ll get a person on this. Share your email and any relevant details (order #, screenshots, or what you were trying to do).`,
      ]),
    };
  }

  // Unknown: still helpful, but don’t sound robotic.
  return {
    intent: 'unknown',
    needsHuman: true,
    reply: pick([
      `${hello}I can help — what are you trying to do (returns, shipping, order status, sizing, or setup)? If you share a bit more detail, I’ll point you to the right next step.`,
      `${hello}Thanks for the message. Can you tell me a little more about what you need help with? If it’s order-related, include your order number.`,
      `${hello}Got it. What’s the main goal here — fixing something, setting up the widget, or helping a customer order? Share a couple details and I’ll route this correctly.`,
    ]),
  };
}