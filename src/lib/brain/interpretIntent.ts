// src/lib/brain/interpretIntent.ts

export type InterpretedIntent = {
  intent:
    | "product_search"
    | "order_help"
    | "return_help"
    | "shipping_help"
    | "store_question"
    | "general_chat";

  category?: string;
  language?: string;

  userGoal: string;

  // ✅ NEW: support-specific fields
  supportTopic?: "order" | "return" | "shipping" | "store";
  urgency?: "low" | "medium" | "high";
  requiresHuman?: boolean;

  filters?: {
    minPrice?: number;
    maxPrice?: number;
    color?: string;
    style?: string;
  };
};

function extractJson(text: string) {
  const trimmed = String(text || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

function lower(text: string) {
  return String(text || "").toLowerCase();
}

function fallbackInterpret(message: string): InterpretedIntent {
  const t = lower(message);

  const categoryMap: Array<[string, string[]]> = [
    ["jackets", ["jacket", "jackets", "coat", "coats"]],
    ["dresses", ["dress", "dresses", "gown", "gowns"]],
    ["snowboards", ["snowboard", "snowboards"]],
    ["bicycles", ["bicycle", "bicycles", "bike", "bikes"]],
    ["books", ["book", "books", "novel", "novels"]],
    ["toys", ["toy", "toys"]],
    ["clothing", ["clothes", "clothing", "apparel"]],
    ["shirts", ["shirt", "shirts", "tee", "t-shirt"]],
    ["shoes", ["shoe", "shoes", "sneaker", "sneakers"]],
    ["headphones", ["headphone", "headphones", "earbud", "earbuds"]],
    ["laptops", ["laptop", "laptops", "notebook"]],
    ["phones", ["phone", "phones", "smartphone"]],
    ["watches", ["watch", "watches"]],
    ["bags", ["bag", "bags", "backpack", "backpacks"]],
    ["furniture", ["furniture", "chair", "table", "desk"]],
    ["kitchen", ["kitchen", "cookware", "pan", "pot"]],
    ["beauty", ["beauty", "skincare", "makeup"]],
    ["fitness", ["fitness", "dumbbell", "yoga", "exercise"]],
  ];

  let category: string | undefined;
  for (const [key, terms] of categoryMap) {
    if (terms.some((term) => t.includes(term))) {
      category = key;
      break;
    }
  }

  let intent: InterpretedIntent["intent"] = "general_chat";

  if (
    t.includes("show me") ||
    t.includes("find") ||
    t.includes("looking for") ||
    t.includes("recommend") ||
    t.includes("search") ||
    t.includes("buy") ||
    t.includes("shop") ||
    t.includes("product") ||
    t.includes("products") ||
    category
  ) {
    intent = "product_search";
  } else if (t.includes("return") || t.includes("refund") || t.includes("exchange") || t.includes("cancel")) {
    intent = "return_help";
  } else if (t.includes("shipping") || t.includes("delivery")) {
    intent = "shipping_help";
  } else if (t.includes("order") || t.includes("track") || t.includes("tracking")) {
    intent = "order_help";
  } else if (t.includes("store") || t.includes("hours") || t.includes("policy") || t.includes("contact")) {
    intent = "store_question";
  }

  const language =
    /[\u4e00-\u9fff]/.test(message) ? "zh" : "en";

  return {
    intent,
    category,
    language,
    userGoal: String(message || "").trim(),
    filters: {},
  };
}

export async function interpretIntentWithAI(
  message: string
): Promise<InterpretedIntent> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackInterpret(message);
  }

  try {
const systemPrompt = [
  "You normalize customer messages for an e-commerce AI assistant.",
  "Return strict JSON only.",
  "Do not include markdown.",
  "Use this JSON structure:",
  '{"intent":"product_search|order_help|return_help|shipping_help|store_question|general_chat","category":null,"language":"en","userGoal":"brief summary","supportTopic":null,"urgency":"low","requiresHuman":false,"filters":{"minPrice":null,"maxPrice":null,"color":null,"style":null}}',
  "Use null when a field cannot be determined.",
  "Never return the literal words optional, unknown, none, or n/a as a field value.",
  "For a product refinement such as 'blue ones', 'black ones', 'cheaper ones', or 'V-neck ones', do not invent a category.",
  "For those refinement messages, set category to null and place the refinement in filters.",
  "Detect customer support scenarios clearly:",
  "- order_help: order status, tracking, or missing package",
  "- return_help: return, refund, exchange, or cancellation",
  "- shipping_help: delivery time, shipping cost, or delays",
  "- store_question: policies, contact information, or hours",
  "If the user is frustrated or needs escalation, set requiresHuman=true.",
  "If the message implies urgency, set urgency=high.",
  "Normalize explicit product categories into simple English labels such as bicycles, books, jackets, dresses, shoes, laptops, toys, or furniture.",
  "Set category only when the current message explicitly names or clearly identifies a product category.",
  "Infer the message language.",
  "Be robust to multilingual input.",
].join(" ");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
        temperature: 0,
        max_tokens: 220,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json().catch(() => null);
    const raw = data?.choices?.[0]?.message?.content || "";
    const jsonText = extractJson(raw);

    if (!jsonText) {
      return fallbackInterpret(message);
    }

const parsed = JSON.parse(jsonText) as InterpretedIntent;

const rawCategory = String(parsed.category || "").trim();
const invalidCategoryValues = new Set([
  "",
  "optional",
  "unknown",
  "none",
  "null",
  "n/a",
  "not applicable",
]);

const safeCategory = invalidCategoryValues.has(rawCategory.toLowerCase())
  ? undefined
  : rawCategory;

return {
  intent: parsed.intent || "general_chat",
  category: safeCategory,
      language: parsed.language || undefined,
      userGoal: parsed.userGoal || String(message || "").trim(),
      filters: parsed.filters || {},
    };
  } catch (err) {
    console.error("INTERPRET_INTENT_AI_ERROR", err);
    return fallbackInterpret(message);
  }
}