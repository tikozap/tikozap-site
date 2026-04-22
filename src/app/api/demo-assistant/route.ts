// src/app/api/demo-assistant/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { extractSearchIntent, mergeSearchState } from "@/lib/demoBrain";

export const runtime = "nodejs";

type DemoProduct = {
  id: string;
  title: string;
  price?: number;
  image?: string;
  available?: boolean;
  url?: string;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `
You are Tiko, an AI sales and customer support assistant for Shopify merchants.

Your behavior:
- You are intelligent, natural, and conversational like ChatGPT
- You understand context, not just keywords
- You help both with:
  1) Product discovery (for shoppers)
  2) Business value (for merchants)

Rules:
- Never hallucinate products
- If products are returned, refer to them naturally (do NOT invent new ones)
- Be concise but insightful
- Always guide toward value or next step

Tone:
- Professional, confident, slightly energetic
- East Coast business tone
`;

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
    const body = await req.json();

    const userText: string = body.userText || "";
    const historyRaw = body.history || [];

    const history: HistoryMessage[] = historyRaw.map((m: any) => ({
      role: m.role,
      content: m.content,
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
    reply: `Most Shopify stores see:

- 10-25% increase in conversion
- More products discovered per session
- Fewer abandoned visits

For a 50K/month store:

That is roughly 5K-12K extra monthly revenue.

And I only take 1% when I generate sales.

So if I do not help you make money, you do not pay.

Want me to estimate based on your store?`,
    source: "rule",
    safePreview: true,
    products: [],
  });
} else if (intent === "activation") {
  return NextResponse.json({
    reply: `Getting started is simple:

1. Connect your Shopify store
2. I learn your catalog instantly
3. Add the chat widget
4. Start converting visitors

No complex setup.

Want me to walk you through it live?`,
    source: "rule",
    safePreview: true,
    products: [],
  });
}

    // ---------- GENERAL (ChatGPT-like) ----------
    if (client) {
      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
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
      reply: "I’m here to help with products, Shopify, and growing your store.",
      source: "canned",
      safePreview: true,
      products: [],
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json({
      reply: "Something went wrong. Try again.",
      source: "canned",
      safePreview: true,
      products: [],
    });
  }
}