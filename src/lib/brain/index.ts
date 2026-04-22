// src/lib/brain/index.ts

import { interpretIntentWithAI } from "./interpretIntent";
import type { ProductSearchResult } from "./types";
import {
  extractSearchIntent,
  mergeSearchState,
  type SearchState,
} from "./searchState";
import {
  normalizeShopifyProducts,
  shopifyAdminGraphQL,
} from "@/lib/shopify";

export type BrainHistoryMessage = {
  role: string;
  content: string;
};

export type RunTikoBrainInput = {
  message: string;
  history?: BrainHistoryMessage[];
  searchState?: SearchState;
};

export type RunTikoBrainOutput = {
  reply: string;
  products: ProductSearchResult[];
  searchState: SearchState;
};

const PRODUCTS_QUERY = `
  query SearchProducts($first: Int!, $query: String!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          totalInventory
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

function lower(text: string) {
  return String(text || "").toLowerCase();
}
function detectCategory(text: string): string | undefined {
  const t = lower(text);

  if (t.includes("jacket") || t.includes("jackets") || t.includes("coat") || t.includes("coats")) return "jackets";
  if (t.includes("dress") || t.includes("dresses") || t.includes("gown") || t.includes("gowns")) return "dresses";
  if (t.includes("snowboard") || t.includes("snowboards")) return "snowboards";
  if (t.includes("bicycle") || t.includes("bicycles") || t.includes("bike") || t.includes("bikes")) return "bicycles";
  if (t.includes("book") || t.includes("books") || t.includes("novel") || t.includes("novels")) return "books";
  if (t.includes("toy") || t.includes("toys")) return "toys";
  if (t.includes("clothes") || t.includes("clothing") || t.includes("apparel")) return "clothing";
  if (t.includes("shirt") || t.includes("shirts") || t.includes("tee") || t.includes("t-shirt")) return "shirts";
  if (t.includes("shoe") || t.includes("shoes") || t.includes("sneaker") || t.includes("sneakers")) return "shoes";
  if (t.includes("headphone") || t.includes("headphones") || t.includes("earbud") || t.includes("earbuds")) return "headphones";
  if (t.includes("laptop") || t.includes("laptops") || t.includes("notebook")) return "laptops";
  if (t.includes("phone") || t.includes("phones") || t.includes("smartphone")) return "phones";
  if (t.includes("watch") || t.includes("watches")) return "watches";
  if (t.includes("bag") || t.includes("bags") || t.includes("backpack") || t.includes("backpacks")) return "bags";
  if (t.includes("furniture") || t.includes("chair") || t.includes("table") || t.includes("desk")) return "furniture";
  if (t.includes("kitchen") || t.includes("cookware") || t.includes("pan") || t.includes("pot")) return "kitchen";
  if (t.includes("beauty") || t.includes("skincare") || t.includes("makeup")) return "beauty";
  if (t.includes("fitness") || t.includes("dumbbell") || t.includes("yoga") || t.includes("exercise")) return "fitness";

  return undefined;
}

function wantsProductSearch(
  message: string,
  interpretedIntent?: string,
  interpretedCategory?: string
) {
  if (interpretedIntent === "product_search") return true;
  if (interpretedCategory) return true;

  const t = lower(message);

  return (
    t.includes("show me") ||
    t.includes("find") ||
    t.includes("looking for") ||
    t.includes("recommend") ||
    t.includes("search") ||
    t.includes("buy") ||
    t.includes("shop") ||
    t.includes("product") ||
    t.includes("products") ||
    !!detectCategory(t)
  );
}

function buildSearchTerms(
  message: string,
  searchState?: SearchState,
  normalizedCategory?: string
) {
  const raw = String(message || "").trim();
  const t = lower(raw);
  const category = normalizedCategory || detectCategory(t);

  if (category === "jackets") {
    return { query: "jacket", keywords: ["jacket", "jackets", "coat", "coats"] };
  }

  if (category === "dresses") {
    return { query: "dress", keywords: ["dress", "dresses", "gown", "gowns"] };
  }

  if (category === "snowboards") {
    return { query: "snowboard", keywords: ["snowboard", "snowboards"] };
  }

  if (category === "bicycles") {
    return { query: "bicycle", keywords: ["bicycle", "bicycles", "bike", "bikes"] };
  }

  if (category === "books") {
    return { query: "book", keywords: ["book", "books", "novel", "novels"] };
  }

  if (category === "toys") {
    return { query: "toy", keywords: ["toy", "toys"] };
  }

  if (category === "clothing") {
    return { query: "clothing", keywords: ["clothes", "clothing", "apparel"] };
  }

  if (category === "shirts") {
    return { query: "shirt", keywords: ["shirt", "shirts", "tee", "t-shirt"] };
  }

  if (category === "shoes") {
    return { query: "shoes", keywords: ["shoe", "shoes", "sneaker", "sneakers"] };
  }

  if (category === "headphones") {
    return { query: "headphones", keywords: ["headphone", "headphones", "earbud", "earbuds"] };
  }

  if (category === "laptops") {
    return { query: "laptop", keywords: ["laptop", "laptops", "notebook"] };
  }

  if (category === "phones") {
    return { query: "phone", keywords: ["phone", "phones", "smartphone"] };
  }

  if (category === "watches") {
    return { query: "watch", keywords: ["watch", "watches"] };
  }

  if (category === "bags") {
    return { query: "bag", keywords: ["bag", "bags", "backpack", "backpacks"] };
  }

  if (category === "furniture") {
    return { query: "furniture", keywords: ["furniture", "chair", "table", "desk"] };
  }

  if (category === "kitchen") {
    return { query: "kitchen", keywords: ["kitchen", "cookware", "pan", "pot"] };
  }

  if (category === "beauty") {
    return { query: "beauty", keywords: ["beauty", "skincare", "makeup"] };
  }

  if (category === "fitness") {
    return { query: "fitness", keywords: ["fitness", "dumbbell", "yoga", "exercise"] };
  }

  const fallbackQuery = searchState?.lastQuery?.trim() || raw;
  const keywords = fallbackQuery.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);

  return {
    query: fallbackQuery,
    keywords,
  };
}

async function runProductQuery(query: string, keywords: string[]) {
  const raw = await shopifyAdminGraphQL(PRODUCTS_QUERY, {
    first: 6,
    query,
  });

  const products = normalizeShopifyProducts(raw as any);

  return products
    .map((p: ProductSearchResult) => {
      let score = 0;
      const title = String(p.title || "").toLowerCase();

      if (query && title.includes(query.toLowerCase())) score += 10;

      for (const keyword of keywords) {
        if (title.includes(keyword.toLowerCase())) score += 3;
      }

      if ((p as any).available) score += 2;
      if (typeof (p as any).price === "number") score += 1;

      return { ...p, _score: score };
    })
    .sort((a: any, b: any) => b._score - a._score)
    .map(({ _score, ...rest }: any) => rest as ProductSearchResult);
}

async function searchProducts(
  message: string,
  searchState?: SearchState,
  normalizedCategory?: string
): Promise<ProductSearchResult[]> {
  const { query, keywords } = buildSearchTerms(
    message,
    searchState,
    normalizedCategory
  );

  const attempts = Array.from(
    new Set(
      [query, query.toLowerCase(), query.replace(/s\b/g, ""), ...keywords]
        .map((v) => String(v || "").trim())
        .filter(Boolean)
    )
  );

  let merged: ProductSearchResult[] = [];

  for (const attempt of attempts) {
    try {
      const found = await runProductQuery(attempt, keywords);
      merged = [...merged, ...found];
      if (merged.length >= 4) break;
    } catch (err) {
      console.error("BRAIN_SEARCH_ATTEMPT_FAILED", attempt, err);
    }
  }

  const deduped = Array.from(new Map(merged.map((p: any) => [p.id, p])).values());
  return deduped.slice(0, 4);
}

function getFallbackProducts(category?: string): ProductSearchResult[] {
  const catalog: Record<string, ProductSearchResult[]> = {
    jackets: [
      {
        id: "demo-jacket-1",
        title: "City Rain Jacket",
        price: 89,
        image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-jacket-2",
        title: "Insulated Winter Jacket",
        price: 129,
        image: "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    dresses: [
      {
        id: "demo-dress-1",
        title: "Classic Midi Dress",
        price: 89,
        image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-dress-2",
        title: "Summer Floral Dress",
        price: 79,
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    snowboards: [
      {
        id: "demo-snow-1",
        title: "All-Mountain Snowboard",
        price: 149,
        image: "https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-snow-2",
        title: "Freestyle Snowboard",
        price: 129,
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    bicycles: [
      {
        id: "demo-bike-1",
        title: "City Commuter Bicycle",
        price: 499,
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-bike-2",
        title: "Mountain Trail Bike",
        price: 799,
        image: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    books: [
      {
        id: "demo-book-1",
        title: "Modern Business Strategy",
        price: 24,
        image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-book-2",
        title: "Creative Thinking Workbook",
        price: 19,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    toys: [
      {
        id: "demo-toy-1",
        title: "Wooden Building Blocks Set",
        price: 29,
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-toy-2",
        title: "Remote Control Car",
        price: 39,
        image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    clothing: [
      {
        id: "demo-clothing-1",
        title: "Everyday Cotton Hoodie",
        price: 49,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-clothing-2",
        title: "Relaxed Fit Crewneck",
        price: 42,
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    shirts: [
      {
        id: "demo-shirt-1",
        title: "Classic White Tee",
        price: 22,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-shirt-2",
        title: "Striped Cotton Shirt",
        price: 34,
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    shoes: [
      {
        id: "demo-shoe-1",
        title: "Running Sneakers",
        price: 89,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-shoe-2",
        title: "Casual Everyday Shoes",
        price: 74,
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    headphones: [
      {
        id: "demo-headphone-1",
        title: "Wireless Noise-Canceling Headphones",
        price: 199,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-headphone-2",
        title: "True Wireless Earbuds",
        price: 129,
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    laptops: [
      {
        id: "demo-laptop-1",
        title: "Lightweight 14-inch Laptop",
        price: 899,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-laptop-2",
        title: "Performance Notebook Pro",
        price: 1299,
        image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    phones: [
      {
        id: "demo-phone-1",
        title: "Pro Smartphone",
        price: 999,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-phone-2",
        title: "Compact Smartphone",
        price: 699,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    watches: [
      {
        id: "demo-watch-1",
        title: "Minimalist Wrist Watch",
        price: 129,
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-watch-2",
        title: "Smart Fitness Watch",
        price: 199,
        image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    bags: [
      {
        id: "demo-bag-1",
        title: "Travel Backpack",
        price: 69,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-bag-2",
        title: "Everyday Tote Bag",
        price: 54,
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    furniture: [
      {
        id: "demo-furniture-1",
        title: "Modern Accent Chair",
        price: 249,
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-furniture-2",
        title: "Oak Writing Desk",
        price: 399,
        image: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    kitchen: [
      {
        id: "demo-kitchen-1",
        title: "Nonstick Cookware Set",
        price: 119,
        image: "https://images.unsplash.com/photo-1584990347449-a87f7b9d7f2b?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-kitchen-2",
        title: "Chef Knife Set",
        price: 89,
        image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    beauty: [
      {
        id: "demo-beauty-1",
        title: "Hydrating Skincare Set",
        price: 59,
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-beauty-2",
        title: "Essential Makeup Kit",
        price: 69,
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
    fitness: [
      {
        id: "demo-fitness-1",
        title: "Adjustable Dumbbells",
        price: 149,
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
      {
        id: "demo-fitness-2",
        title: "Yoga Mat Pro",
        price: 39,
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80",
        available: true,
      },
    ],
  };

  return category ? catalog[category] || [] : [];
}

function buildRuleBasedReply(
  message: string,
  products: ProductSearchResult[],
  normalizedCategory?: string
) {
  const t = lower(message);
  const category = normalizedCategory || detectCategory(message);

  if (t.includes("what else can you do") || t.includes("what can you do") || t.includes("how can you help")) {
    return "I can help shoppers find products, answer store questions, track orders, and handle returns before your team needs to step in.";
  }

  if (t.includes("customer support") || t.includes("support")) {
    return "I can answer product questions, explain shipping and returns, help with order status, and hand off tricky cases when needed.";
  }

  if (t.includes("中文") || t.includes("chinese") || t.includes("说中文")) {
    return "可以。我可以帮助顾客找商品、回答商店问题、查询订单和配送，也可以处理退换货相关问题。";
  }

  if (t === "hi" || t === "hello" || t === "hey" || t === "hi there" || t === "hello there") {
    return "Hi! How can I help you today?";
  }

  if (t.includes("order") || t.includes("track") || t.includes("tracking")) {
    return "I can help with order status and tracking. Please share your order number.";
  }

  if (t.includes("return") || t.includes("refund") || t.includes("exchange") || t.includes("cancel")) {
    return "I can help with returns, exchanges, or cancellations. Tell me what happened and I’ll guide you.";
  }

  if (t.includes("shipping") || t.includes("delivery")) {
    return "I can help with shipping questions, delivery timing, and international shipping details.";
  }

  if (products.length > 0) {
    if (category === "jackets") return "Here are a few jacket options you might like.";
    if (category === "dresses") return "Here are a few dress options you might like.";
    if (category === "snowboards") return "Here are a few snowboard options you might like.";
    if (category === "bicycles") return "Here are a few bicycle options you might like.";
    if (category === "books") return "Here are a few book options you might like.";
    if (category === "toys") return "Here are a few toy options you might like.";
    if (category === "clothing" || category === "shirts") return "Here are a few clothing options you might like.";
    if (category === "shoes") return "Here are a few shoe options you might like.";
    return "Here are a few product matches you might like.";
  }

    if (wantsProductSearch(message, "product_search", category)) {
    return "I couldn’t find a direct match in this catalog right now. Try a more specific product type, style, or category.";
  }

  return "I can help with product search, customer support, shipping, returns, and general store questions.";
}

function buildSystemPrompt(message: string, products: ProductSearchResult[]) {
  const isChinese =
    lower(message).includes("中文") ||
    lower(message).includes("chinese") ||
    lower(message).includes("说中文");

  const productSummary =
    products.length > 0
      ? products
          .map((p) => {
            const price =
              typeof p.price === "number"
                ? `$${p.price.toFixed(2)}`
                : p.price
                  ? String(p.price)
                  : "price unavailable";
            return `${p.title || "Product"} (${price})`;
          })
          .join("; ")
      : "No direct product matches found.";

  return [
    "You are TikoZap, a smart AI sales and customer support assistant for an online store.",
    "Be natural, warm, concise, and helpful.",
    "Do not sound robotic or repeat the same sentence patterns.",
    "Do not invent products, prices, policies, or order details.",
    "If product matches are provided, use them naturally in the response.",
    "If no product matches are provided, be honest and suggest a more specific search.",
    "For greetings, respond briefly and naturally.",
    "For support questions, sound capable and reassuring.",
    isChinese
      ? "Reply in Chinese."
      : "Reply in the user's language. Use Chinese only if the user asks or writes in Chinese.",
    `Available product matches: ${productSummary}`,
  ].join(" ");
}

async function composeNaturalReply(
  message: string,
  products: ProductSearchResult[],
  normalizedCategory?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildRuleBasedReply(message, products);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: products.length > 0 ? 80 : 120,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(message, products),
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (text) return text;

    return buildRuleBasedReply(message, products, normalizedCategory);
  } catch (err) {
    console.error("COMPOSE_NATURAL_REPLY_ERROR", err);
    return buildRuleBasedReply(message, products, normalizedCategory);
  }
}

export async function runTikoBrain(
  input: RunTikoBrainInput
): Promise<RunTikoBrainOutput> {
  const nextIntent = extractSearchIntent(input.message);
  const nextState = mergeSearchState(input.searchState || {}, nextIntent);

  const interpreted = await interpretIntentWithAI(input.message);

  const category =
    interpreted.category ||
    detectCategory(input.message) ||
    detectCategory(nextState.lastQuery || "");

  let products: ProductSearchResult[] = [];

  if (wantsProductSearch(input.message, interpreted.intent, category)) {
    try {
      products = await searchProducts(input.message, nextState, category);
    } catch (err) {
      console.error("RUN_TIKO_BRAIN_SEARCH_ERROR", err);
    }

    if ((!products || products.length === 0) && category) {
      products = getFallbackProducts(category);
    }
  }

  const reply = await composeNaturalReply(input.message, products, category);

  return {
    reply,
    products,
    searchState: nextState,
  };
}