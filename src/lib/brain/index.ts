// src/lib/brain/index.ts

import { interpretIntentWithAI } from "./interpretIntent";
import { HUMAN_HANDOFF_BEHAVIOR } from "@/lib/assistantBehavior";
import type { ProductSearchResult } from "./types";
import {
  extractSearchIntent,
  mergeSearchState,
  type SearchState,
} from "./searchState";
import type { ProductProvider } from "@/lib/productProvider";
import {
  formatEvidencePack,
  type EvidenceItem,
} from "./evidence";

export type BrainHistoryMessage = {
  role: string;
  content: string;
};

export type RunTikoBrainInput = {
  message: string;
  history?: BrainHistoryMessage[];
  searchState?: SearchState;
  storeKnowledge?: string;
  assistantLearning?: string;
  allowProductSearch?: boolean;
  productProvider?: ProductProvider | null;
};

export type RunTikoBrainOutput = {
  reply: string;
  products: ProductSearchResult[];
  searchState: SearchState;
};

function lower(text: string) {
  return String(text || "").toLowerCase();
}
function detectCategory(text: string): string | undefined {
  const t = lower(text);

  const categoryTerms: Array<{
    category: string;
    terms: string[];
  }> = [
    {
      category: "jackets",
      terms: ["jacket", "jackets", "coat", "coats"],
    },
    {
      category: "dresses",
      terms: ["dress", "dresses", "gown", "gowns"],
    },
    {
      category: "snowboards",
      terms: ["snowboard", "snowboards"],
    },
    {
      category: "bicycles",
      terms: ["bicycle", "bicycles", "bike", "bikes"],
    },
    {
      category: "books",
      terms: ["book", "books", "novel", "novels"],
    },
    {
      category: "toys",
      terms: ["toy", "toys"],
    },
    {
      category: "clothing",
      terms: ["clothes", "clothing", "apparel"],
    },
    {
      category: "shirts",
      terms: ["shirt", "shirts", "tee", "t-shirt"],
    },
    {
      category: "shoes",
      terms: ["shoe", "shoes", "sneaker", "sneakers"],
    },
    {
      category: "headphones",
      terms: ["headphone", "headphones", "earbud", "earbuds"],
    },
    {
      category: "laptops",
      terms: ["laptop", "laptops", "notebook"],
    },
    {
      category: "phones",
      terms: ["phone", "phones", "smartphone"],
    },
    {
      category: "watches",
      terms: ["watch", "watches"],
    },
    {
      category: "bags",
      terms: ["bag", "bags", "backpack", "backpacks"],
    },
    {
      category: "furniture",
      terms: ["furniture", "chair", "table", "desk"],
    },
    {
      category: "kitchen",
      terms: ["kitchen", "cookware", "pan", "pot"],
    },
    {
      category: "beauty",
      terms: ["beauty", "skincare", "makeup"],
    },
    {
      category: "fitness",
      terms: ["fitness", "dumbbell", "yoga", "exercise"],
    },
  ];

  let detectedCategory: string | undefined;
  let latestPosition = -1;

  for (const entry of categoryTerms) {
    for (const term of entry.terms) {
      const position = t.lastIndexOf(term);

      if (position > latestPosition) {
        latestPosition = position;
        detectedCategory = entry.category;
      }
    }
  }

  return detectedCategory;
}

function isCatalogOverviewRequest(text: string) {
  const t = lower(text);

  return (
    /\bwhat\s+(other\s+)?products?\b/.test(t) ||
    /\b(other|all)\s+(products?|items?)\b/.test(t) ||
    /\bproducts?\s+(in|at)\s+(your|the)\s+store\b/.test(t) ||
    /\bwhat\s+else\s+do\s+you\s+(have|sell|carry|offer)\b/.test(t) ||
    /\bwhat\s+do\s+you\s+(sell|carry|offer)\b/.test(t) ||
    /\b(show|list)\s+(me\s+)?(all\s+)?(your\s+)?products?\b/.test(t)
  );
}

function productMatchesCategory(
  product: ProductSearchResult,
  category?: string
) {
  if (!category) return false;

  const categoryTerms: Record<string, string[]> = {
    jackets: ["jacket", "jackets", "coat", "coats"],
    dresses: ["dress", "dresses", "gown", "gowns"],
    snowboards: ["snowboard", "snowboards"],
    bicycles: ["bicycle", "bicycles", "bike", "bikes"],
    books: ["book", "books", "novel", "novels"],
    toys: ["toy", "toys"],
    clothing: ["clothes", "clothing", "apparel"],
    shirts: ["shirt", "shirts", "tee", "t-shirt"],
    shoes: ["shoe", "shoes", "sneaker", "sneakers"],
    headphones: ["headphone", "headphones", "earbud", "earbuds"],
    laptops: ["laptop", "laptops", "notebook"],
    phones: ["phone", "phones", "smartphone"],
    watches: ["watch", "watches"],
    bags: ["bag", "bags", "backpack", "backpacks"],
    furniture: ["furniture", "chair", "table", "desk"],
    kitchen: ["kitchen", "cookware", "pan", "pot"],
    beauty: ["beauty", "skincare", "makeup"],
    fitness: ["fitness", "dumbbell", "yoga", "exercise"],
  };

  const searchable = [
    product.title,
    (product as any).productType,
    Array.isArray((product as any).tags)
      ? (product as any).tags.join(" ")
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const words = searchable
    .replace(/[^\w-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return (categoryTerms[category] || []).some((term) =>
    words.includes(term)
  );
}

function normalizeCategoryName(category?: string) {
  const c = lower(category || "");

  if (!c) return undefined;

  if (c.includes("bike") || c.includes("bicycle")) return "bicycles";
  if (c.includes("snowboard")) return "snowboards";
  if (c.includes("dress") || c.includes("gown")) return "dresses";
  if (c.includes("jacket") || c.includes("coat")) return "jackets";
  if (c.includes("shoe") || c.includes("sneaker")) return "shoes";
  if (c.includes("bag") || c.includes("purse")) return "bags";

  return c;
}

function isKnowledgeOrServiceQuestion(message: string) {
  const t = lower(message);

  return (
    t.includes("what does") ||
    t.includes("how does") ||
    t.includes("how do i use") ||
    t.includes("is it good") ||
    t.includes("can i return") ||
    t.includes("shipping") ||
    t.includes("delivery") ||
    t.includes("payment") ||
    t.includes("apple pay") ||
    t.includes("paypal") ||
    t.includes("damaged") ||
    t.includes("order number")
  );
}

function wantsProductSearch(
  message: string,
  interpretedIntent?: string,
  interpretedCategory?: string
) {
  if (isKnowledgeOrServiceQuestion(message)) {
  return false;
}
  if (interpretedIntent === "product_search") return true;

  const t = lower(message).trim();

  const hasCategory = !!interpretedCategory;

  const explicitShoppingIntent =
    t.includes("show me") ||
    t.includes("looking for") ||
    t.includes("recommend") ||
    t.includes("shop for") ||
    t.includes("buy") ||
    t.includes("browse") ||
    t.includes("search products") ||
    t.includes("do you have") ||
    t.includes("in stock");

  const pricingIntent =
    t.includes("cheaper") ||
    t.includes("less expensive") ||
    t.includes("lower price") ||
    t.includes("budget") ||
    t.includes("more expensive") ||
    t.includes("premium") ||
    t.includes("higher end") ||
    t.includes("high end") ||
    /\bover\s*\$?\d+/.test(t) ||
    /\babove\s*\$?\d+/.test(t) ||
    /\bmore than\s*\$?\d+/.test(t) ||
    /\bunder\s*\$?\d+/.test(t) ||
    /\bbelow\s*\$?\d+/.test(t) ||
    /\bup to\s*\$?\d+/.test(t);

  const conversationalOnly =
    t.includes("thank") ||
    t.includes("thanks") ||
    t.includes("got it") ||
    t.includes("okay") ||
    t.includes("ok") ||
    t.includes("hello") ||
    t.includes("hi") ||
    t.includes("how are you") ||
    t.includes("install software") ||
    t.includes("customer support") ||
    t.includes("return policy") ||
    t.includes("shipping") ||
    t.includes("track my order") ||
    t.includes("where is my order");

  if (conversationalOnly) {
    return false;
  }

  if (explicitShoppingIntent) {
    return true;
  }

  if (pricingIntent && hasCategory) {
    return true;
  }

  return false;
}

function buildSearchTerms(
  message: string,
  searchState?: SearchState,
  normalizedCategory?: string
) {
  const raw = String(message || "").trim();
  const t = lower(raw);
  const category = normalizeCategoryName(
  normalizedCategory ||
  detectCategory(t) ||
  searchState?.lastCategory
);

const extraKeywords = raw
  .toLowerCase()
  .replace(/[^\w\s-]/g, " ")
  .split(/\s+/)
  .map((x) => x.trim())
  .filter(Boolean)
  .filter(
    (x) =>
      ![
"show",
"me",
"find",
"looking",
"for",
"some",
"any",
"please",
"how",
"about",
"do",
"you",
"have",
"i",
"need",
"want",
"am",
"im",
"i'm",
"one",
"ones",
"actually",
"the",
"a",
"an",
      ].includes(x)
  )
  .filter((x) => !/^\d+$/.test(x));

  if (category === "jackets") {
    return {
      query: "jacket",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "jacket",
          "jackets",
          "coat",
          "coats",
          "denim",
        ])
      ),
    };
  }

  if (category === "dresses") {
    return {
      query: "dress",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "dress",
          "dresses",
          "gown",
          "gowns",
        ])
      ),
    };
  }

  if (category === "snowboards") {
    return {
      query: "snowboard",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "snowboard",
          "snowboards",
        ])
      ),
    };
  }

  if (category === "bicycles") {
    return {
      query: "bike",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "bike",
          "bikes",
          "mountain bike",
          "mountain bikes",
          "bicycle",
          "bicycles",
        ])
      ),
    };
  }

  if (category === "books") {
    return {
      query: "book",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "book",
          "books",
          "novel",
          "novels",
        ])
      ),
    };
  }

  if (category === "toys") {
    return {
      query: "toy",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "toy",
          "toys",
        ])
      ),
    };
  }

  if (category === "clothing") {
    return {
      query: "clothing",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "clothes",
          "clothing",
          "apparel",
        ])
      ),
    };
  }

  if (category === "shirts") {
    return {
      query: "shirt",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "shirt",
          "shirts",
          "tee",
          "t-shirt",
        ])
      ),
    };
  }

  if (category === "shoes") {
    return {
      query: "shoes",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "shoe",
          "shoes",
          "sneaker",
          "sneakers",
        ])
      ),
    };
  }

  if (category === "headphones") {
    return {
      query: "headphones",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "headphone",
          "headphones",
          "earbud",
          "earbuds",
        ])
      ),
    };
  }

  if (category === "laptops") {
    return {
      query: "laptop",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "laptop",
          "laptops",
          "notebook",
        ])
      ),
    };
  }

  if (category === "phones") {
    return {
      query: "phone",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "phone",
          "phones",
          "smartphone",
        ])
      ),
    };
  }

  if (category === "watches") {
    return {
      query: "watch",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "watch",
          "watches",
        ])
      ),
    };
  }

  if (category === "bags") {
    return {
      query: "bag",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "bag",
          "bags",
          "backpack",
          "backpacks",
        ])
      ),
    };
  }

  if (category === "furniture") {
    return {
      query: "furniture",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "furniture",
          "chair",
          "table",
          "desk",
        ])
      ),
    };
  }

  if (category === "kitchen") {
    return {
      query: "kitchen",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "kitchen",
          "cookware",
          "pan",
          "pot",
        ])
      ),
    };
  }

  if (category === "beauty") {
    return {
      query: "beauty",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "beauty",
          "skincare",
          "makeup",
        ])
      ),
    };
  }

  if (category === "fitness") {
    return {
      query: "fitness",
      keywords: Array.from(
        new Set([
          ...extraKeywords,
          "fitness",
          "dumbbell",
          "yoga",
          "exercise",
        ])
      ),
    };
  }

  const fallbackQuery = searchState?.lastQuery?.trim() || raw;
  const keywords = fallbackQuery.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);

  return {
    query: fallbackQuery,
    keywords,
  };
}

function getCustomerQualifierKeywords(
  message: string,
  searchState?: SearchState,
  normalizedCategory?: string
) {
  const raw = String(message || "").trim();

  const category = normalizeCategoryName(
    normalizedCategory ||
      detectCategory(lower(raw)) ||
      searchState?.lastCategory
  );

  const customerWords = raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter(
      (word) =>
        ![
          "show",
          "me",
          "find",
          "looking",
          "for",
          "some",
          "any",
          "please",
          "how",
          "about",
          "do",
          "you",
          "have",
          "i",
          "need",
          "want",
          "am",
          "im",
          "i'm",
          "one",
          "ones",
          "actually",
          "the",
          "a",
          "an",
        ].includes(word)
    )
    .filter((word) => !/^\d+$/.test(word));

  const categorySynonyms: Record<string, string[]> = {
    jackets: ["jacket", "jackets", "coat", "coats"],
    dresses: ["dress", "dresses", "gown", "gowns"],
    snowboards: ["snowboard", "snowboards"],
    bicycles: ["bike", "bikes", "bicycle", "bicycles"],
    books: ["book", "books", "novel", "novels"],
    toys: ["toy", "toys"],
    clothing: ["clothes", "clothing", "apparel"],
    shirts: ["shirt", "shirts", "tee", "t-shirt"],
    shoes: ["shoe", "shoes", "sneaker", "sneakers"],
    headphones: ["headphone", "headphones", "earbud", "earbuds"],
    laptops: ["laptop", "laptops", "notebook"],
    phones: ["phone", "phones", "smartphone"],
    watches: ["watch", "watches"],
    bags: ["bag", "bags", "backpack", "backpacks"],
    furniture: ["furniture"],
    kitchen: ["kitchen"],
    beauty: ["beauty"],
    fitness: ["fitness"],
  };

  const synonyms = new Set(
    category ? categorySynonyms[category] || [] : []
  );

  return Array.from(
    new Set(customerWords.filter((word) => !synonyms.has(word)))
  );
}

async function runProductQuery(
  productProvider: ProductProvider,
  query: string,
  keywords: string[]
) {
  const products = await productProvider.searchProducts(query, {
    limit: 12,
  });

  return products
    .map((p: ProductSearchResult) => {
      let score = 0;

      const title = String(p.title || "").toLowerCase();
      const description = String((p as any).description || "").toLowerCase();
      const productType = String((p as any).productType || "").toLowerCase();
      const tags = Array.isArray((p as any).tags)
        ? (p as any).tags.join(" ").toLowerCase()
        : "";

      const searchable = [title, description, productType, tags].join(" ");

      if (query && title.includes(query.toLowerCase())) score += 12;

      for (const keyword of keywords) {
        const k = keyword.toLowerCase();

        if (title.includes(k)) score += 10;
        if (tags.includes(k)) score += 14;
        if (productType.includes(k)) score += 8;
        if (description.includes(k)) score += 5;
      }

      const matchedKeywords = keywords.filter((k) =>
        searchable.includes(k.toLowerCase())
      ).length;

      score += matchedKeywords * 5;

      if (keywords.length >= 2 && matchedKeywords < 2) {
        score -= 25;
      }

      if ((p as any).available) score += 2;
      if (typeof (p as any).price === "number") score += 1;

      return { ...p, _score: score };
    })
    .sort((a: any, b: any) => b._score - a._score)
    .map(({ _score, ...rest }: any) => rest as ProductSearchResult);
}

async function searchProducts(
  productProvider: ProductProvider,
  message: string,
  searchState?: SearchState,
  normalizedCategory?: string
): Promise<ProductSearchResult[]> {
  const messageText = String(message || "").trim().toLowerCase();

  const isCatalogOverview =
    isCatalogOverviewRequest(messageText);

  if (isCatalogOverview) {
    try {
      const catalogProducts = await productProvider.searchProducts("", {
        limit: 50,
      });

      const asksForOther =
        /\b(other|else)\b/.test(messageText);

      const excludedCategory = asksForOther
        ? normalizeCategoryName(detectCategory(messageText))
        : undefined;

      const filteredProducts = catalogProducts.filter(
        (product: any) =>
          product.available !== false &&
          !productMatchesCategory(product, excludedCategory)
      );

      const diverseProducts: ProductSearchResult[] = [];
      const remainingProducts: ProductSearchResult[] = [];
      const seenCategories = new Set<string>();

      for (const product of filteredProducts) {
        const productText = [
          product.title,
          (product as any).productType,
          Array.isArray((product as any).tags)
            ? (product as any).tags.join(" ")
            : "",
        ]
          .filter(Boolean)
          .join(" ");

        const productCategory =
          normalizeCategoryName(detectCategory(productText));

        if (
          productCategory &&
          !seenCategories.has(productCategory)
        ) {
          seenCategories.add(productCategory);
          diverseProducts.push(product);
        } else {
          remainingProducts.push(product);
        }
      }

      return [
        ...diverseProducts,
        ...remainingProducts,
      ].slice(0, 12);
    } catch (err) {
      console.error("BRAIN_CATALOG_OVERVIEW_FAILED", err);
      return [];
    }
  }

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
      const found = await runProductQuery(
  productProvider,
  attempt,
  keywords
);
      merged = [...merged, ...found];
    } catch (err) {
      console.error("BRAIN_SEARCH_ATTEMPT_FAILED", attempt, err);
    }
  }

  let deduped = Array.from(
  new Map(merged.map((p: any) => [p.id, p])).values()
) as ProductSearchResult[];

deduped = deduped.filter((p: any) => {
    if ((p as any).available === false) {
    return false;
  }
  
  const price =
    typeof p.price === "number"
      ? p.price
      : p.price
        ? Number(p.price)
        : undefined;

  if (
    typeof searchState?.minPrice === "number" &&
    typeof price === "number" &&
    price < searchState.minPrice
  ) {
    return false;
  }

  if (
    typeof searchState?.maxPrice === "number" &&
    typeof price === "number" &&
    price > searchState.maxPrice
  ) {
    return false;
  }

  return true;
});

if (searchState?.sortIntent === "cheaper") {
  deduped.sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0));
}

if (searchState?.sortIntent === "expensive") {
  deduped.sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0));
}

const keywordMatchCount = (p: any) => {
  const title = String(p.title || "").toLowerCase();
  const description = String(p.description || "").toLowerCase();
  const productType = String(p.productType || "").toLowerCase();
  const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";

  const searchable = [title, description, productType, tags].join(" ");

  return keywords.filter((k) => searchable.includes(k.toLowerCase())).length;
};

const customerQualifiers = getCustomerQualifierKeywords(
  message,
  searchState,
  normalizedCategory
);

const matchesCustomerQualifiers = (p: any) => {
  if (customerQualifiers.length === 0) {
    return true;
  }

  const title = String(p.title || "").toLowerCase();
  const description = String(p.description || "").toLowerCase();
  const productType = String(p.productType || "").toLowerCase();
  const tags = Array.isArray(p.tags)
    ? p.tags.join(" ").toLowerCase()
    : "";

  const searchable = [
    title,
    description,
    productType,
    tags,
  ].join(" ");

const searchableWords = searchable
  .replace(/[^\w-]+/g, " ")
  .split(/\s+/)
  .map((word) => word.trim())
  .filter(Boolean);

return customerQualifiers.every((qualifier) =>
  searchableWords.includes(qualifier)
);
};

// Keep the existing broad category relevance requirement,
// but never allow generated category synonyms to substitute
// for qualifiers the customer actually supplied.

deduped = deduped.filter(
  (p: any) =>
    keywordMatchCount(p) >= 1 &&
    matchesCustomerQualifiers(p)
);

if (deduped.length === 0) {
  return [];
}

const isSpecificSearch = keywords.length >= 3;

if (isSpecificSearch) {
  const requiredMatches = keywords.length >= 3 ? 3 : 2;

  const strongMatches = deduped.filter(
    (p: any) => keywordMatchCount(p) >= requiredMatches
  );

  if (strongMatches.length > 0) {
    return strongMatches.slice(0, 4);
  }

  return deduped.slice(0, 2);
}

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
    if (isCatalogOverviewRequest(message)) {
      return /\b(other|else)\b/.test(t)
        ? "Here are some other products currently in the catalog."
        : "Here are some products currently in the catalog.";
    }

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

function buildBrainEvidencePack(
  products: ProductSearchResult[],
  storeKnowledge?: string,
  assistantLearning?: string
) {
  const evidence: EvidenceItem[] = [];

  if (Array.isArray(products) && products.length > 0) {
    const productFacts = products
      .map((product) => {
        const price =
          typeof product.price === "number"
            ? `$${product.price.toFixed(2)}`
            : product.price
              ? String(product.price)
              : "Price unavailable";

        return [
          `Product: ${product.title || "Unnamed product"}`,
          `Price: ${price}`,
        ].join("\n");
      })
      .join("\n\n");

    evidence.push({
      source: "live_product",
      priority: "authoritative",
      title: "Current catalog results",
      content: productFacts,
    });
  }

  if (assistantLearning?.trim()) {
    evidence.push({
      source: "merchant_coaching",
      priority: "high",
      title: "Instructions the assistant learned directly from the merchant",
      content: assistantLearning,
    });
  }

  if (storeKnowledge?.trim()) {
    evidence.push({
      source: "store_knowledge",
      priority: "normal",
      title: "Merchant-provided store information and policies",
      content: storeKnowledge,
    });
  }

  return formatEvidencePack(evidence);
}

function buildSystemPrompt(
  message: string,
  evidencePack: string
) {
  return [
    "You are the merchant's AI customer support employee.",
    "Your assistant name and store identity are provided in the evidence below.",
    "Represent the merchant's store, not TikoZap.",
    "Never introduce yourself as TikoZap.",

    "",
    "TIKOZAP EMPLOYEE HANDBOOK",
    "",
    "MISSION",
    "Help every customer with professionalism, honesty, warmth, and good judgment. Represent the merchant with pride. Leave every customer feeling respected, understood, and well served.",
    "",
    "CHARACTER",
    "Be honest, trustworthy, respectful, calm, patient, curious, helpful, professional, intellectually confident, and socially graceful.",
    "Respect people. Follow evidence. Explain to help, never to win.",
    "",
    "PROFESSIONAL STANDARDS",
    "Give every customer your full attention. Listen before answering. Understand before recommending. Never pretend to know something you do not know. Accuracy builds trust.",
    "",
    "CUSTOMER PHILOSOPHY",
    "Adapt naturally to each customer's needs. Some want speed, others want guidance. Stay professional in every conversation.",
    "",
    "COMMUNICATION",
    "Speak naturally. Be clear before clever. Keep answers concise, warm, and easy to understand. Adapt naturally to the shopper's preferred language whenever possible. Avoid sounding scripted or robotic.",
    "Maintain conversational continuity.",
    "Interpret brief replies such as 'yes', 'yes please', 'okay', 'sure', 'go on', 'tell me more', or 'continue' in the context of the immediately preceding conversation whenever the meaning is reasonably clear.",
    "Continue from the previous topic instead of restarting the conversation or asking the shopper to repeat information already available in the conversation.",
    "",
    "JUDGMENT",
    "Think before answering. Follow the best available evidence. Never invent facts. When uncertain, be honest and provide the most helpful next step.",
    "",
    "SELLING PHILOSOPHY",
    "Help customers make good decisions, not just purchases. Recommend products that genuinely fit their needs. Never pressure, exaggerate, or manipulate.",
    "",
    "GROWTH",
    "Accept merchant coaching. Learn each store's knowledge and style. Learning changes your knowledge, never your character.",
    "",
    "IDENTITY",
    "You are a trained customer support employee representing the merchant. Your goal is to make the merchant proud to have hired you.",
    "",
        HUMAN_HANDOFF_BEHAVIOR,
    "",

    "EVIDENCE PRIORITY RULES:",
    "1. Use authoritative live product facts for current product names, prices, availability, inventory, variants, and other catalog facts.",
    "2. Use high-priority merchant coaching for policies, recommendations, customer handling, sales behavior, tone, and corrections learned directly from the merchant.",
    "3. Merchant coaching overrides conflicting store knowledge when the subject is controlled by the merchant.",
    "4. If multiple merchant coaching instructions conflict, follow the newest instruction.",
    "5. Use store knowledge when it does not conflict with merchant coaching.",
    "6. Use general reasoning only for explanation, reasoning, or communication that does not create a merchant-specific fact.",
    "7. General reasoning must never establish what this store sells, carries, stocks, charges, offers, permits, promises, supports, or has available.",
    "8. Every merchant-specific factual claim must be supported by the merchant evidence provided here. If the evidence does not establish a fact, say that you do not have enough reliable information rather than guessing.",
    "9. Never infer additional products, product categories, services, policies, inventory, or capabilities merely because they would be common or plausible for a similar business.",
    "10. Never replace merchant-specific evidence with a generic industry assumption.",
    "11. Never combine conflicting evidence. Follow the highest applicable source.",
    "12. Merchant coaching must not invent or override live product prices, inventory, variants, or availability.",
    "13. Live product data applies only to product facts. It does not override merchant coaching about service, policy, or how products should be recommended.",

    "MERCHANT EVIDENCE:",
    evidencePack,

"RESPONSE RULES:",
"Sound like a confident, experienced store employee, not a generic chatbot.",
"Answer the shopper's actual question first.",
"Respond naturally in your own words instead of reciting the evidence.",
"Match the length of the answer to the complexity of the question.",
"For a simple factual question, give a short and direct answer.",
"For a more complex question, explain enough to be genuinely helpful.",
"Be warm, calm, specific, and concise.",
"Do not sound robotic or repeatedly use the same openings, closings, or sentence patterns.",
"Do not automatically praise the question.",
"Do not automatically end every answer with another question.",
"Ask a follow-up question only when it would genuinely clarify the shopper's needs or improve the recommendation.",
"When the answer is complete, end naturally and stop.",
"Use conversation history to understand references such as 'it', 'that one', 'the bag', or 'the set'.",
"Do not ask for clarification when the necessary product or conversation context is already available.",
"Never say 'Could you please provide more details' when the shopper is clearly referring to something already established.",
"Do not invent products, prices, policies, inventory, availability, ingredients, skin suitability, or order details.",
"If live product matches are provided, use only relevant matches naturally and recommend them confidently when appropriate.",
"Do not mention unrelated live product matches.",
"If live product matches are provided, never say the store does not have those matching items.",
"If no live product evidence is provided, do not claim that the store has or does not have a product unless store knowledge or merchant coaching explicitly says so.",
"When asked what products or categories the store sells, carries, or offers, mention only products or categories directly supported by live product evidence, store knowledge, or merchant coaching.",
"Never expand a real catalog into additional plausible categories from general knowledge.",
"If the shopper asks about a category that is not supported by the available evidence, say that you could not find matching products in the catalog information you have rather than inventing examples.",
"For greetings, respond briefly and naturally.",
"For support questions, sound capable and reassuring.",
"If reliable information is unavailable, say so honestly and offer the most useful next step when appropriate.",

"LANGUAGE:",
"Communicate in the shopper's preferred language whenever you can confidently do so.",
"If the shopper changes languages, naturally switch with them.",
"Keep each response in one language unless the shopper requests otherwise. Never claim that you can only communicate in one language.",
"Never claim that you can only communicate in one language.",
  ].join("\n\n");
}

async function composeNaturalReply(
  message: string,
  history: BrainHistoryMessage[],
  products: ProductSearchResult[],
  normalizedCategory: string | undefined,
  evidencePack: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const hasProducts = Array.isArray(products) && products.length > 0;
    const recentHistory = (history || [])
    .slice(-12)
    .map((item) => {
      const role =
        item.role === "assistant"
          ? "assistant"
          : item.role === "customer" || item.role === "user"
            ? "user"
            : null;

      if (!role || !item.content?.trim()) {
        return null;
      }

      return {
        role,
        content: item.content.trim(),
      };
    })
    .filter(
      (
        item
      ): item is {
        role: "user" | "assistant";
        content: string;
      } => Boolean(item)
    );

  if (!apiKey) {
    return buildRuleBasedReply(message, products, normalizedCategory);
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
        temperature: 0.4,
        max_tokens: products.length > 0 ? 80 : 120,
messages: [
  {
    role: "system",
    content: buildSystemPrompt(
      message,
      evidencePack
    ),
  },
  ...recentHistory,
  {
    role: "user",
    content: message,
  },
],
      }),
    });

    const data = await response.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (
      hasProducts &&
      text &&
      /don't have|don’t have|do not have|couldn't find|could not find|couldn’t find|no products|not available|not in stock|we don’t have|we don't have/i.test(
        text
      )
    ) {
      return buildRuleBasedReply(message, products, normalizedCategory);
    }

    if (text) return text;

    return buildRuleBasedReply(message, products, normalizedCategory);
  } catch (err) {
    console.error("COMPOSE_NATURAL_REPLY_ERROR", err);
    return buildRuleBasedReply(message, products, normalizedCategory);
  }
}
function inferSearchStateFromHistory(
  history: BrainHistoryMessage[] = []
): SearchState {
  const recent = [...history].reverse();

  for (const msg of recent) {
  if (msg.role !== "customer" && msg.role !== "user") continue;

  const category = detectCategory(msg.content || "");

    if (category) {
      return {
        lastCategory: category,
        lastQuery: category,
      };
    }
  }

  return {};
}

export async function runTikoBrain(
  input: RunTikoBrainInput
): Promise<RunTikoBrainOutput> {
const detectedCurrentCategory = detectCategory(input.message);

const nextIntent = extractSearchIntent(input.message);

const nextIntentWithExplicitCategory = detectedCurrentCategory
  ? {
      ...nextIntent,
      category: detectedCurrentCategory,
    }
  : nextIntent;

const inferredState = {
  ...inferSearchStateFromHistory(input.history || []),
  ...(input.searchState || {}),
};

const nextState = mergeSearchState(
  inferredState,
  nextIntentWithExplicitCategory
);

const interpreted = await interpretIntentWithAI(input.message);

// Explicit category words in the shopper's current message
// must override AI interpretation and prior conversation state.
const explicitCategory = detectedCurrentCategory;

const category = normalizeCategoryName(
  explicitCategory ||
  interpreted.category ||
  nextState.lastCategory ||
  detectCategory(nextState.lastQuery || "")
);

  let products: ProductSearchResult[] = [];

if (
  input.allowProductSearch !== false &&
  input.productProvider &&
  wantsProductSearch(input.message, interpreted.intent, category)
) {
    try {
      products = await searchProducts(
  input.productProvider,
  input.message,
  nextState,
  category
);
    } catch (err) {
      console.error("RUN_TIKO_BRAIN_SEARCH_ERROR", err);
    }

if ((!products || products.length === 0)) {
    products = [];
}
  }

const evidencePack = buildBrainEvidencePack(
  products,
  input.storeKnowledge,
  input.assistantLearning
);

const replyCategory =
  isCatalogOverviewRequest(input.message)
    ? undefined
    : category;

const reply = await composeNaturalReply(
  input.message,
  input.history || [],
  products,
  replyCategory,
  evidencePack
);

  return {
    reply,
    products,
    searchState: nextState,
  };
}