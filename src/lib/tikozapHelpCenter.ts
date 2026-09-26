// src/lib/tikozapHelpCenter.ts

export type HelpCenterTopic = {
  id: string;
  title: string;
  keywords: string[];
  content: string[];
};

export type HelpCenterCategory = {
  id: string;
  title: string;
  description: string;
  topics: HelpCenterTopic[];
};

export const TIKOZAP_HELP_CENTER: HelpCenterCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description:
      "Set up your store and assistant, test everything, and go live.",
    topics: [
      {
        id: "what-is-tikozap",
        title: "What is TikoZap?",
        keywords: [
          "start",
          "overview",
          "ai employee",
          "assistant",
          "small business",
          "store",
        ],
        content: [
          "TikoZap gives your business an AI assistant that can help customers through your website Widget, Starter Link, Voice, and other supported channels.",
          "Your assistant can answer questions using information about your store, learn from your coaching, and hand conversations to you when a customer needs a person.",
        ],
      },
      {
        id: "trial",
        title: "Start your 14-day Pro trial",
        keywords: [
          "trial",
          "signup",
          "14 day",
          "pro",
          "credit card",
          "start",
        ],
        content: [
          "New stores begin with a 14-day Pro trial so you can set up and test TikoZap before choosing a paid plan.",
          "During the trial, set up your store profile, assistant, Knowledge, Widget or Starter Link, and test common customer questions.",
        ],
      },
      {
        id: "website-or-link",
        title: "Website store or no-website store?",
        keywords: [
          "website",
          "starter link",
          "widget",
          "no website",
          "onboarding",
        ],
        content: [
          "If you have a website, you can install the TikoZap Widget on your site.",
          "If you do not have a website, Starter Link gives you a public storefront page with your assistant.",
          "Website stores can also use Starter Link if they want an additional shareable page.",
        ],
      },
      {
        id: "first-test",
        title: "Test your assistant before going live",
        keywords: [
          "test",
          "widget",
          "practice",
          "assistant",
          "before launch",
        ],
        content: [
          "Use Test & Coach or the Test Widget to ask the kinds of questions your customers are likely to ask.",
          "Check products, shipping, returns, store information, and anything else important to your business before customers start using your assistant.",
        ],
      },
    ],
  },

  {
    id: "assistant-knowledge",
    title: "Assistant & Knowledge",
    description:
      "Set your assistant’s identity and teach it what it needs to know.",
    topics: [
      {
        id: "assistant-identity",
        title: "Set up your assistant",
        keywords: [
          "identity",
          "name",
          "greeting",
          "tone",
          "style",
          "voice",
          "assistant",
        ],
        content: [
          "Go to Assistant → Identity to set your assistant’s name and customer-facing identity.",
          "Your assistant belongs to your store. Customers interact with the assistant name you choose.",
        ],
      },
      {
        id: "test-and-coach",
        title: "How do I teach my assistant?",
        keywords: [
          "teach",
          "test",
          "coach",
          "learning",
          "correction",
          "wrong answer",
        ],
        content: [
          "Go to Assistant → Test & Coach. Start a test conversation by asking your assistant a question.",
          "If an answer is incorrect, use Coach to explain what the assistant should do differently next time. You can also teach new information directly.",
        ],
      },
      {
        id: "memory",
        title: "What is Memory?",
        keywords: [
          "memory",
          "notebook",
          "learning history",
          "edit",
          "delete",
          "current understanding",
        ],
        content: [
          "Memory shows what your assistant has learned from your coaching history.",
          "You can review, search, edit, or delete learning. Your assistant keeps its learning history but answers customers using its current understanding.",
        ],
      },
      {
        id: "knowledge",
        title: "What should I put in Knowledge?",
        keywords: [
          "knowledge",
          "store info",
          "shipping",
          "return",
          "faq",
          "products",
          "policy",
        ],
        content: [
          "Knowledge is the place for business information your assistant should use when helping customers.",
          "Add store information, shipping policy, return policy, FAQs, product guidance, size charts, and other practical information about how your store works.",
        ],
      },
      {
        id: "knowledge-vs-coaching",
        title: "Knowledge or coaching — which should I use?",
        keywords: [
          "knowledge",
          "coaching",
          "difference",
          "teach",
          "instruction",
        ],
        content: [
          "Use Knowledge for store facts and policies that customers may ask about.",
          "Use Test & Coach when you want to correct how your assistant handled a situation or teach it how you want similar situations handled in the future.",
        ],
      },
    ],
  },

  {
    id: "inbox",
    title: "Inbox",
    description:
      "Work with your assistant and step into customer conversations when needed.",
    topics: [
      {
        id: "inbox-overview",
        title: "How does the Inbox work?",
        keywords: [
          "inbox",
          "conversations",
          "customer",
          "messages",
          "ai active",
          "staff",
        ],
        content: [
          "Inbox keeps customer conversations together so you can see what your assistant and customer have said.",
          "You can review conversations, use tags, add internal notes, take over from AI, and reply to customers yourself.",
        ],
      },
      {
        id: "take-over",
        title: "Take over a conversation",
        keywords: [
          "take over",
          "human",
          "staff reply",
          "resume ai",
          "customer",
        ],
        content: [
          "When a conversation needs you, select it in Inbox and use Take over.",
          "You can then reply as a staff member. The customer keeps the same conversation history, so you do not need to start over.",
        ],
      },
      {
        id: "ai-draft",
        title: "Use AI’s draft",
        keywords: [
          "ai draft",
          "suggested reply",
          "staff",
          "inbox",
        ],
        content: [
          "AI’s draft can prepare a suggested reply based on the customer conversation.",
          "Review the draft before using it. You remain in control of what is sent to the customer.",
        ],
      },
      {
        id: "coach-from-inbox",
        title: "Coach your assistant from a real conversation",
        keywords: [
          "coach assistant",
          "inbox",
          "real customer",
          "learning",
          "correction",
        ],
        content: [
          "If you see an answer that should be handled differently, use Coach your assistant from the conversation.",
          "Your coaching becomes part of your assistant’s learning so it can handle similar situations better in the future.",
        ],
      },
      {
        id: "notes-tags",
        title: "Internal notes and tags",
        keywords: [
          "internal notes",
          "tags",
          "organize",
          "conversation",
          "team",
        ],
        content: [
          "Internal notes are visible to your team but not to the customer.",
          "Tags help you organize and find conversations that need similar follow-up.",
        ],
      },
    ],
  },

  {
    id: "widget-starter-link",
    title: "Widget & Starter Link",
    description:
      "Choose how customers reach your assistant online.",
    topics: [
      {
        id: "install-widget",
        title: "How do I install the website Widget?",
        keywords: [
          "install",
          "widget",
          "website",
          "script",
          "code",
          "domain",
        ],
        content: [
          "Go to Widget in your Dashboard and copy your installation script.",
          "Add the script to your website footer, just before the closing </body> tag. If you use a website builder, look for an area named Custom Code, Footer Code, or Body End.",
        ],
      },
      {
        id: "test-widget",
        title: "How do I test my Widget?",
        keywords: [
          "test widget",
          "inbox",
          "practice",
          "installation",
        ],
        content: [
          "Use Test widget from the Widget page. TikoZap opens a practice panel and places the test conversation in Inbox.",
          "This is for testing the customer experience. Use Test & Coach when you want to train your assistant.",
        ],
      },
      {
        id: "allowed-domains",
        title: "What are Allowed domains?",
        keywords: [
          "allowed domains",
          "website",
          "security",
          "widget",
          "domain",
        ],
        content: [
          "Allowed domains tell TikoZap which websites may run your Widget.",
          "Add each website where you plan to use the Widget and save your domains before testing the installation.",
        ],
      },
      {
        id: "starter-link",
        title: "What is Starter Link?",
        keywords: [
          "starter link",
          "no website",
          "storefront",
          "public page",
        ],
        content: [
          "Starter Link is a public storefront page hosted by TikoZap. It gives customers a place to find your store information, products, and assistant even if you do not have a website.",
          "You can share your Starter Link anywhere you would share a normal website link.",
        ],
      },
      {
        id: "starter-link-content",
        title: "Set up your Starter Link storefront",
        keywords: [
          "starter link",
          "storefront information",
          "products",
          "branding",
          "footer",
        ],
        content: [
          "In Starter Link, add your branding, products, and Storefront Information such as About us, contact, shipping, and returns.",
          "Save your changes and use Preview to check the public page before sharing it with customers.",
        ],
      },
      {
        id: "widget-and-link",
        title: "Can I use Widget and Starter Link together?",
        keywords: [
          "widget",
          "link",
          "together",
          "both",
          "website",
          "starter link",
        ],
        content: [
          "Yes. A website store can use the Widget on its own website and also keep a Starter Link as an additional shareable storefront.",
        ],
      },
    ],
  },

  {
    id: "voice-phone",
    title: "Voice & Phone Agent",
    description:
      "Help customers through spoken conversations and phone support.",
    topics: [
      {
        id: "voice",
        title: "How does Voice work?",
        keywords: [
          "voice",
          "speak",
          "microphone",
          "realtime",
          "conversation",
        ],
        content: [
          "Voice lets customers speak naturally with your assistant instead of typing.",
          "Microphone permission is required on the customer’s device. Customers can switch between text and Voice when the experience supports both.",
        ],
      },
      {
        id: "free-voice",
        title: "How much free Voice is included?",
        keywords: [
          "free voice",
          "20 questions",
          "daily",
          "usage",
        ],
        content: [
          "Every store receives 20 free Voice questions per day, even without a Voice subscription.",
          "You can view Voice usage and available Voice plans from Billing.",
        ],
      },
      {
        id: "voice-stopped",
        title: "Why did Voice stop working?",
        keywords: [
          "voice stopped",
          "limit",
          "microphone",
          "permission",
          "daily",
        ],
        content: [
          "First check microphone permission in the browser or device.",
          "If the store is using free Voice, it may also have reached the daily 20-question limit. Billing shows the current Voice usage.",
        ],
      },
      {
        id: "phone-agent",
        title: "What is Phone Agent?",
        keywords: [
          "phone agent",
          "calls",
          "telephone",
          "customer",
          "voice",
          "setup",
        ],
        content: [
          "Phone Agent extends your TikoZap assistant to customer phone conversations.",
          "Use the Phone Agent section of your Dashboard to review and configure the phone features available to your store.",
        ],
      },
    ],
  },

  {
    id: "billing-account",
    title: "Billing & Account",
    description:
      "Manage your trial, plan, billing, Voice usage, and store settings.",
    topics: [
      {
        id: "trial-ended",
        title: "What happens when my trial ends?",
        keywords: [
          "trial",
          "expired",
          "ended",
          "paused",
          "assistant",
          "billing",
        ],
        content: [
          "When your 14-day Pro trial ends without a paid plan, your assistant pauses.",
          "Your assistant, Knowledge, learning, conversations, and settings remain safely preserved. Choose a plan in Billing whenever you are ready to continue.",
        ],
      },
      {
        id: "choose-plan",
        title: "Choose or change a plan",
        keywords: [
          "plan",
          "starter",
          "pro",
          "business",
          "upgrade",
          "downgrade",
          "billing",
        ],
        content: [
          "Go to Billing in your Dashboard to review your current plan and available plan options.",
          "Billing also shows your current usage and Voice options.",
        ],
      },
      {
        id: "monthly-annual",
        title: "Monthly or annual billing",
        keywords: [
          "monthly",
          "annual",
          "billing",
          "subscription",
          "payment",
        ],
        content: [
          "Available billing options are shown on the Billing page when you choose or change a plan.",
        ],
      },
      {
        id: "cancel",
        title: "What happens if I cancel?",
        keywords: [
          "cancel",
          "cancellation",
          "subscription",
          "data preserved",
        ],
        content: [
          "Your paid access remains available through the period you have already paid for.",
          "When paid access ends, your assistant pauses while your store information and account data remain preserved.",
        ],
      },
      {
        id: "settings",
        title: "Update your store and account settings",
        keywords: [
          "settings",
          "owner name",
          "store profile",
          "website",
          "category",
          "hours",
          "account",
        ],
        content: [
          "Use Settings to update your store profile, owner name, website, category, business hours, Inbox options, assistant settings, Voice settings, and other available controls.",
        ],
      },
    ],
  },
];

export const TIKOZAP_POPULAR_HELP_TOPIC_IDS = [
  "test-and-coach",
  "install-widget",
  "starter-link",
  "trial-ended",
  "take-over",
  "voice-stopped",
] as const;