// src/app/api/demo-assistant/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractSearchIntent, mergeSearchState } from "@/lib/demoBrain";
import { buildTikoMarketingInstructions } from "@/lib/buildTikoMarketingInstructions";
import { getTikoLearning } from '@/lib/tikoLearningContext';
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/rateLimit";

export const runtime = "nodejs";

type DemoProduct = {
  id: string;
  title: string;
  price?: number;
  image?: string;
  available?: boolean;
  url?: string;
};

type ChatBody = {
  message?: string;
  conversationId?: string | null;
  image?: string | null;
  publicKey?: string | null;
  channel?: string | null;
  mode?: "marketing" | "merchant";
  tags?: string[] | null;
  visitor?: {
    name?: string | null;
  } | null;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function detectIntent(
  text: string
): "product" | "revenue" | "business" | "activation" | "general" {
  const lower = text.toLowerCase();

  // 🔥 STRONG PRODUCT DETECTION
  if (
    lower.match(/\b(dress|dresses|jacket|jackets|shoes|bag|bags|snowboard|hoodie|shirt)\b/) ||
    lower.match(/\b(over|under|below|above|between)\b/) ||
    lower.match(/\$\d+/) ||
    lower.includes("show") ||
    lower.includes("find") ||
    lower.includes("recommend") ||
    lower.includes("something like") ||
    lower.includes("pictures") ||
    lower.includes("similar")
  ) {
    return "product";
  }

  if (lower.includes("revenue") || lower.includes("roi")) {
    return "revenue";
  }

  if (
    lower.includes("help my shopify") ||
    lower.includes("benefit") ||
    lower.includes("why should")
  ) {
    return "business";
  }

  if (
    lower.includes("start") ||
    lower.includes("setup") ||
    lower.includes("install")
  ) {
    return "activation";
  }

  return "general";
}

async function callShopifySearch(req: Request, text: string) {
  try {
    const url = new URL("/api/shopify/search", req.url);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-tikozap-internal-secret":
      process.env.SHOPIFY_SEARCH_INTERNAL_SECRET || "",
  },
  body: JSON.stringify({ text }),
  cache: "no-store",
});

    if (!res.ok) return [];

    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

function buildProductReply(products: DemoProduct[]) {
  if (!products.length) {
    return `I searched the store but didn’t find strong matches yet.

Let me adjust the search — want me to broaden the price range or try a different style?`;
  }

  return `Here are some strong matches from the store.

These are real products — in a live store I’d attach a “Buy Now” button right here and guide the customer to checkout.

Want me to refine these further — like style, price, or occasion?`;
}

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(req, {
      namespace: "demo-assistant",
      limit: 20,
      windowMs: 60_000,
    });

    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Too many demo requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: rateLimitHeaders(rl),
        }
      );
    }

    const body = await req.json();

const userText = String(body.userText || "").trim();

if (!userText) {
  return NextResponse.json(
    { error: "Missing message" },
    { status: 400 }
  );
}

if (userText.length > 4000) {
  return NextResponse.json(
    { error: "Message is too long." },
    { status: 400 }
  );
}

const historyRaw = Array.isArray(body.history)
  ? body.history.slice(-12)
  : [];

const history: HistoryMessage[] = historyRaw
  .filter(
    (m: any) =>
      (m?.role === "user" || m?.role === "assistant") &&
      typeof m?.content === "string"
  )
  .map((m: any) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }));

    const client = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

const intent = detectIntent(userText);

// ---------- INTENT ROUTING ----------
if (intent === "product") {
  const search = extractSearchIntent(userText);

const products = await fetch(new URL("/api/shopify/search", req.url), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-tikozap-internal-secret":
      process.env.SHOPIFY_SEARCH_INTERNAL_SECRET || "",
  },
  body: JSON.stringify({
      query: search.query,
      filters: {
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        available: true,
      },
      limit: 6,
    }),
  })
    .then((r) => r.json())
    .then((d) => d.products || [])
    .catch(() => []);

  if (!products.length) {
    return NextResponse.json({
      reply: `I searched the store but didn’t find matches for "${search.query}" in that price range.

Want me to broaden it or try a different category?`,
      source: "rule",
      safePreview: true,
      products: [],
    });
  }

  return NextResponse.json({
    reply: `Here are relevant ${search.query} from the store.

These are real products — I can guide a customer directly to checkout from here.

Want me to refine by price, style, or features?`,
    source: "rule",
    safePreview: true,
    products,
  });
} else if (intent === "business") {
  return NextResponse.json({
    reply: `Here is how I help Shopify stores:

- Convert product questions into purchases
- Reduce drop-off by answering instantly
- Recommend the right products at the right moment

Most stores lose sales because customers hesitate or leave.

I step in at that exact moment and guide them to checkout.

I do not just chat - I close deals.

Want me to simulate a real customer interaction?`,
    source: "rule",
    safePreview: true,
    products: [],
  });
} else if (intent === "revenue") {
  return NextResponse.json({
    reply: `TikoZap is designed to help stores respond faster, reduce unanswered customer questions, and guide shoppers more consistently.

The business impact depends on factors such as store traffic, products, customer questions, and how the merchant trains the assistant, so I should not promise a specific revenue increase.

I can explain how TikoZap supports sales and customer service workflows if that would help.`,
    source: "rule",
    safePreview: true,
    products: [],
  });
} else if (intent === "activation") {
  return NextResponse.json({
    reply: `Getting started with TikoZap is straightforward:

1. Create your store workspace.
2. Name and configure your AI assistant.
3. Add products, policies, FAQs, and other store knowledge.
4. Install the website widget, or use Starter Link if you do not have a website.
5. Review conversations and coach the assistant when needed.

Would you like help choosing between the website widget and Starter Link?`,
    source: "rule",
    safePreview: true,
    products: [],
  });
}

// ---------- GENERAL (ChatGPT-like) ----------
if (client) {
const tikoLearning = await getTikoLearning({
  target: 'tiko_web',
  channel: 'text',
});

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: buildTikoMarketingInstructions(tikoLearning),
      },
      ...history,
      {
        role: "user",
        content: userText,
      },
    ],
    max_output_tokens: 300,
  });

      return NextResponse.json({
        reply: response.output_text || "",
        source: "model",
        safePreview: true,
        products: [],
      });
    }

    return NextResponse.json({
      reply:
  "I’m Tiko, TikoZap’s product representative. I can explain setup, Starter Link, the website widget, voice, coaching, pricing, and how your AI assistant works.",
      source: "canned",
      safePreview: true,
      products: [],
    });
  } catch (err) {
    console.error(
  "[demo-assistant] Request failed",
  err instanceof Error ? err.message : "Unknown error"
);

    return NextResponse.json({
      reply: "Something went wrong. Try again.",
      source: "canned",
      safePreview: true,
      products: [],
    });
  }
}