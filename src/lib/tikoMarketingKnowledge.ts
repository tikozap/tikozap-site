// src/lib/tikoMarketingKnowledge.ts

export const TIKO_MARKETING_KNOWLEDGE = {
  company: {
    name: "TikoZap",
    summary:
      "TikoZap is an AI employee platform for online stores. It helps merchants answer customers, handle voice and chat, take over conversations, coach their assistant, and improve service over time.",
  },

  howItWorks: {
    summary:
      "Merchants create an AI customer support employee, give it a name and role, add store knowledge, and connect it through a website widget or Starter Link.",
    steps: [
      "Create a store workspace.",
      "Name and configure the assistant.",
      "Add products, policies, FAQs, and documents.",
      "Connect the website widget or use Starter Link.",
      "Review conversations and take over when needed.",
      "Coach the assistant when it makes a mistake.",
      "Use Learning, Experience, and Memory to improve service over time.",
    ],
  },

  installation: {
    websiteWidget:
      "Merchants with a website can install the TikoZap widget using a script provided in the dashboard.",
    starterLink:
      "Merchants without a website can use a hosted Starter Link and share it anywhere.",
    support:
      "Merchants may install the widget themselves or request installation help.",
  },

  capabilities: {
    chat:
      "The assistant can answer customer questions through live chat.",
    voice:
      "The assistant can speak with customers through supported voice experiences.",
    humanTakeover:
      "A merchant can take over a conversation at any time and later resume AI.",
    coaching:
      "If the assistant makes a mistake, the merchant can correct it and provide guidance for future conversations.",
    knowledge:
      "Answers can use products, store policies, FAQs, uploaded documents, images, and merchant coaching.",
    multilingual:
      "The assistant can communicate in multiple languages when customers use them.",
  },

  assistantGrowth: {
    identity:
      "Merchants can name the assistant, choose its role, greeting, tone, response style, appearance, and voice style.",
    learning:
      "Learning surfaces patterns from real customer conversations and asks the merchant for guidance.",
    experience:
      "Experience shows how the assistant improves its service judgment from repeated customer interactions.",
    memory:
      "Memory helps retain useful customer, product, business, and service context.",
  },

appearance: {
  summary:
    "Merchants can use the built-in default assistant avatar or upload their own assistant photo.",
  launcher:
    "For the launcher, merchants can choose the default avatar, their uploaded assistant photo, or a chat bubble.",
  chat:
    "For chat, merchants can choose the default avatar or their uploaded assistant photo.",
  voice:
    "For voice conversations, merchants can choose the default avatar or their uploaded assistant photo.",
  naming:
    "The uploaded photo and assistant name belong to the merchant's store. The default avatar can also be used with any merchant-chosen assistant name.",
},

  security: {
    summary:
      "TikoZap is designed so merchants remain in control of their assistant, store information, and customer service workflow.",
    boundaries: [
      "Tiko should not claim certifications, compliance, encryption standards, or legal guarantees unless they are explicitly documented.",
      "Tiko should not promise that data is never stored or shared unless that is verified in current policy.",
    ],
  },

  pricing: {
    trial:
      "TikoZap offers a 14-day Pro trial with no credit card required.",
    billing:
      "Plans may be billed monthly or yearly, depending on the selected option.",
    cancellation:
      "Subscriptions can be canceled effective at the end of the current billing period.",
    limits:
      "Plans include conversation limits, and merchants can upgrade as their usage grows.",
  },

  support: {
    summary:
      "Tiko can explain setup, installation, product capabilities, pricing, and how merchants manage their AI employee.",
  },
} as const;