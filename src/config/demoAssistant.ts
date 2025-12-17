// src/config/demoAssistant.ts

// 1. System prompt for the LLM demo assistant
export const DEMO_ASSISTANT_SYSTEM_PROMPT = `
You are TikoZap — the product and onboarding assistant for the TikoZap platform.

This is a SAFE PREVIEW, not a real store. You never see or change real
orders, accounts, or customer data.

Your goals in this demo are:

1) Show how you’d support an online store.
   - Answer questions about orders, shipping, returns, refunds, and sizing
     using EXAMPLE policies and data only.
   - When the user pretends to be a shopper (“Where is my order?”, “I want
     to return my shoes”), explain clearly what you WOULD do in the real app,
     step by step.

2) Explain what TikoZap can do for a merchant.
   - Answer questions about TikoZap’s capabilities, integrations, language
     support, and setup based on the knowledge you’ve been given.
   - Do NOT invent specific prices or contracts. When unsure, say that
     details are on the pricing page or docs.

3) Stay honest, safe, and on-topic.
   - Emphasize that this is a demo using sample data only.
   - Never claim to access real orders, payment information, or private data.
     Use phrases like “In a real store I would…” or “In production I’d…”.
   - Politely avoid medical, legal, financial, or dangerous topics. Say you
     are focused on store support and TikoZap.
   - If the user goes very off-topic, briefly answer or decline, then gently
     steer back to e-commerce or TikoZap.

4) Behave like a strong support rep.
   - Tone: warm, concise, professional — like a friendly senior support agent.
   - Use plain language. Avoid jargon unless the user shows they are technical.
   - Be calm and empathetic if the user is frustrated. Apologize for
     confusion, never be sarcastic or hostile.
   - When you don’t know something, say so honestly and suggest what the
     real assistant or human team would do.

5) Handle languages.
   - Detect the user’s language from their last message. You can reply in
     English, Spanish, or Chinese.
   - Follow the user’s language choice; do NOT switch languages on your own
     without being asked.

6) Vary your wording.
   - If the user asks similar questions multiple times (for example about
     order status, returns, sizing, or “what can you do?”), keep the core
     meaning consistent but PARAPHRASE your answer so it doesn’t sound
     copy-pasted.
   - Keep answers focused: most replies should be 2–5 short paragraphs or a
     few bullet points, unless the user explicitly asks for more detail.

When in doubt, remember: you are here to SHOW how TikoZap would behave in a
real store, while clearly stating that this is only a demo using sample data.
`.trim();

// 2. Buckets for canned / example replies

// src/config/demoAssistant.ts

export type DemoBucketName =
  | 'order'
  | 'returns'
  | 'sizing'
  | 'capabilities'
  | 'language_zh'
  | 'language_es'
  | 'greeting'
  | 'off_topic';

export const DEMO_BUCKET_TEXT: Record<DemoBucketName, string[]> = {
  order: [
    `In a real store, I’d look up the order in your backend, pull the latest carrier tracking, and reply with the current status and delivery ETA — all within the guardrails you set.`,
    `Normally I’d check the order number, fetch the most recent shipping update, and show where the package is and when it’s expected to arrive.`,
    `In production, I’d connect to your platform (like Shopify), read the order status and tracking, and share a clear update instead of making customers dig through emails.`,
  ],
  returns: [
    `I’d follow your return policy, look up the customer’s order, and walk them through the steps — including labels, timelines, and refund status.`,
    `In the full product, I’d answer return questions using your own rules: which items are eligible, any fees, and how refunds are processed.`,
    `I can guide customers through the whole return or exchange flow so your team only handles unusual cases.`,
  ],
  sizing: [
    `I’d use your size chart, recent return patterns, and any fit notes you’ve added to suggest the best size — and flag edge cases for a human to review.`,
    `In production I can combine your size guide with past orders and returns to make smarter sizing suggestions for each customer.`,
    `For tricky sizing questions, I cover the basics and then hand off to your team when someone is between sizes or has special needs.`,
  ],
  capabilities: [
    `In the full version, I handle most routine questions about orders, shipping, returns, and products, and then hand off tricky chats to your human team.`,
    `Think of me as a first-line support rep: I cover FAQs and simple actions 24/7, while your humans focus on higher-value conversations.`,
    `I read your FAQs, policies, and previous tickets so answers stay on-brand and consistent, instead of everyone improvising in the inbox.`,
  ],
  language_zh: [
    `当然可以。在这个演示里，我只是用假数据做示范。\n\n在正式的 TikoZap 里，我会根据你店铺自己的政策、商品信息和常见问题，用中文或英文来回答顾客。真正复杂的情况，可以随时转给人工客服处理。`,
    `可以的，这个演示环境是安全的，只用示例数据来展示效果。\n\n在真实的工作区里，我会接入你的商城系统（比如 Shopify）、读取你的政策和常见问题，用中文帮你回复“物流、退换货、尺码”等咨询，把比较特殊的情况转给人工同事。`,
    `没问题，我可以用中文和你聊天。\n\n现在只是演示版，所以我用的是虚拟数据。正式使用时，我会读你的商品、订单和规则，自动回答大部分重复问题。`,
    `我可以用中文说明我是怎么工作的，也可以切换到英文。\n\n在正式的 TikoZap 里，你可以让同一个助手同时服务多种语言的顾客，让他们都能看到一致、专业的回答。`,
  ],
  language_es: [
    `Sí, también puedo responder en español. En esta demo solo uso datos de ejemplo.\n\nEn la versión completa, el asistente se entrena con tus políticas, productos y preguntas frecuentes para ayudar a tus clientes y pasar los casos difíciles a tu equipo humano.`,
    `Claro. Aquí solo estoy usando datos de demostración.\n\nEn el producto real me conecto a tu plataforma (por ejemplo Shopify), leo tus reglas de envío y devoluciones, y respondo en español o inglés según lo que necesiten tus clientes.`,
  ],
  greeting: [
    `Hi 👋 I’m TikoZap. Ask me about features, pricing, setup, or how it works. If you ask store questions (shipping/returns/order status), I’ll show an example answer and explain how merchants configure TikoZap.`,
    `Nice to meet you 👋 This is a safe preview, so I’ll explain what I *would* do with real store data instead of touching anything live.`,
  ],
  off_topic: [
    `This demo is mainly for store questions like orders, shipping, returns, or sizing. For anything outside that, I’ll keep the answer short so you can get a feel for how the assistant behaves.`,
    `I’m set up to talk mostly about online-store support. If your question is far outside that, I’ll keep things brief — the real product would be tuned to your own use case.`,
  ],
};

export function demoDetectBucket(text: string): DemoBucketName {
  const lower = text.toLowerCase().trim();

  // Chinese
  const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
  if (hasChineseChars || lower.includes('中文')) {
    return 'language_zh';
  }

  // Spanish
  if (
    lower.includes('español') ||
    lower.includes('espanol') ||
    lower.includes('spanish')
  ) {
    return 'language_es';
  }

  // Order-ish
  if (
    lower.includes('where is my order') ||
    lower.includes("where's my order") ||
    lower.includes('order status') ||
    lower.includes('tracking') ||
    lower.includes('track my order') ||
    (lower.includes('order') && lower.includes('#'))
  ) {
    return 'order';
  }

  // Returns / refunds
  if (
    lower.includes('return') ||
    lower.includes('refund') ||
    lower.includes('exchange')
  ) {
    return 'returns';
  }

  // Sizing
  if (
    lower.includes('size') ||
    lower.includes('sizing') ||
    lower.includes('fit') ||
    lower.includes('which size')
  ) {
    return 'sizing';
  }

  // "What can you do?"
  if (
    lower.includes('what can you do') ||
    lower.includes('what do you do') ||
    lower.includes('capabilities') ||
    lower.includes('how do you work') ||
    lower.includes('how does this work') ||
    lower.includes('how it works')
  ) {
    return 'capabilities';
  }

  // Greetings
  if (/^(hi|hello|hey|hola|嗨|你好)[!. ]?$/i.test(lower)) {
    return 'greeting';
  }

  return 'off_topic';
}

// 3. Optional: simple limit strings you can show in the UI
export const DEMO_SOFT_LIMIT_WARNING = `
You’re getting close to the end of this short demo.
To see how I work with your real orders and policies, you can start a free 14-day Pro trial and connect your store.
`.trim();

export const DEMO_HARD_LIMIT_MESSAGE = `
That was the last question I’m set up to answer in this demo.

To really see what I can do — using your own products, orders, and policies —
you can start a free 14-day Pro trial and connect your store.
`.trim();
