// src/app/api/shopify/search/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  checkRateLimit,
  rateLimitHeaders,
} from '@/lib/rateLimit';

const SHOPIFY_SEARCH_INTERNAL_SECRET =
  process.env.SHOPIFY_SEARCH_INTERNAL_SECRET || "";

type SearchBody = {
  text?: string;
  query?: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    colors?: string[];
    categories?: string[];
    available?: boolean;
  };
  keywords?: string[];
  limit?: number;
};

type ShopifySearchResponse = {
  data?: {
    products?: {
      edges?: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          description?: string | null;
          productType?: string | null;
          tags?: string[];
          vendor?: string | null;
          totalInventory?: number | null;
          images?: {
            edges?: Array<{
              node: {
                url?: string | null;
              };
            }>;
          };
          featuredMedia?: {
            preview?: {
              image?: {
                url?: string | null;
              } | null;
            } | null;
          } | null;
          variants?: {
            edges?: Array<{
              node: {
                id: string;
                title: string;
                price?: string | null;
                inventoryQuantity?: number | null;
              };
            }>;
          };
        };
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

type ProductCard = {
  id: string;
  title: string;
  description?: string;
  productType?: string;
  tags?: string[];
  vendor?: string;
  price?: number;
  image?: string;
  available?: boolean;
  url?: string;
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  dress: ["dress", "dresses", "gown", "gowns"],
  jacket: ["jacket", "jackets", "denim jacket", "denim jackets"],
  bag: ["bag", "bags", "handbag", "handbags", "purse", "purses", "leather bag", "leather bags"],
  sneaker: ["sneaker", "sneakers", "shoe", "shoes", "trainer", "trainers"],
  snowboard: ["snowboard", "snowboards"],
  bike: ["bike", "bikes", "bicycle", "bicycles", "mountain bike", "mountain bikes"],
};

const CATEGORY_KEYWORDS = [
  "dress",
  "dresses",
  "jacket",
  "jackets",
  "snowboard",
  "snowboards",
  "shoes",
  "bags",
  "bag",
  "hat",
  "hats",
  "hoodie",
  "hoodies",
  "shirt",
  "shirts",
  "charger",
  "chargers",
  "headphones",
  "earbuds",
  "watch",
  "watches",
];

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-01";

  if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  if (!token) throw new Error("Missing SHOPIFY_ADMIN_ACCESS_TOKEN");

  return { domain, token, version };
}

async function shopifyAdminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { domain, token, version } = getShopifyConfig();

  const res = await fetch(
    `https://${domain}/admin/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify request failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

function extractPriceFilters(text: string) {
  const lower = text.toLowerCase();

  const between = lower.match(/between\s*\$?\s*(\d+)\s*(?:and|-)\s*\$?\s*(\d+)/i);
  if (between) {
    return {
      minPrice: Number(between[1]),
      maxPrice: Number(between[2]),
    };
  }

  const under = lower.match(/(?:under|below|less than|up to)\s*\$?\s*(\d+)/i);
  const over = lower.match(/(?:over|above|more than)\s*\$?\s*(\d+)/i);

  return {
    minPrice: over ? Number(over[1]) : undefined,
    maxPrice: under ? Number(under[1]) : undefined,
  };
}

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();

  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some((alias) => lower.includes(alias))) {
      return category;
    }
  }

  return undefined;
}

const STOPWORDS = new Set([
  "show",
  "me",
  "find",
  "search",
  "for",
  "a",
  "an",
  "the",
  "some",
  "any",
  "pictures",
  "picture",
  "photos",
  "photo",
  "recommend",
  "product",
  "products",
  "please",
  "like",
  "this",
  "that",
  "over",
  "under",
  "between",
  "more",
  "than",
  "less",
  "with",
  "and",
]);

function normalizeKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ")
        .split(/\s+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((x) => !STOPWORDS.has(x))
        .filter((x) => !/^\d+$/.test(x))
    )
  ).slice(0, 8);
}

function deriveSearchBody(body: SearchBody) {
  const text = body.text?.trim() || "";
  const category = detectCategory(text);

 const parsedPrice = text
  ? extractPriceFilters(text)
  : { minPrice: undefined, maxPrice: undefined };
  const keywords = Array.from(
    new Set([
      ...(body.keywords ?? []),
      ...normalizeKeywords(text),
      ...(category ? [category] : []),
      ...((body.filters?.categories ?? []).filter(Boolean) as string[]),
    ])
  ).slice(0, 8);

  const minPrice =
    typeof body.filters?.minPrice === "number"
      ? body.filters.minPrice
      : parsedPrice.minPrice;

  const maxPrice =
    typeof body.filters?.maxPrice === "number"
      ? body.filters.maxPrice
      : parsedPrice.maxPrice;

  const query =
    body.query?.trim() ||
    [category, ...keywords].filter(Boolean).join(" ").trim();

  return {
    query,
    keywords,
    filters: {
      minPrice,
      maxPrice,
      colors: body.filters?.colors ?? [],
      categories: body.filters?.categories ?? (category ? [category] : []),
      available: body.filters?.available !== false,
    },
    limit: Math.min(Math.max(body.limit ?? 6, 1), 12),
  };
}

function buildShopifyQuery(input: ReturnType<typeof deriveSearchBody>) {
  const parts: string[] = [];

if (input.filters.categories?.length) {
  parts.push(input.filters.categories[0]);
} else if (input.query) {
  parts.push(input.query);
} else {
    for (const keyword of input.keywords) {
      if (keyword) parts.push(keyword);
    }
  }

  if (input.filters.available) {
    parts.push("status:active");
  }

  return Array.from(new Set(parts)).join(" ").trim();
}

const PRODUCTS_QUERY = `
  query SearchProducts($first: Int!, $query: String!) {
    products(first: $first, query: $query) {
      edges {
        node {
  id
  title
  handle
  description
  productType
  tags
  vendor
  totalInventory
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          variants(first: 3) {
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

function normalizeProducts(json: ShopifySearchResponse): ProductCard[] {
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const edges = json.data?.products?.edges ?? [];

  return edges.map(({ node }) => {
    const firstVariant = node.variants?.edges?.[0]?.node;

    const image =
      node.images?.edges?.[0]?.node?.url ||
      node.featuredMedia?.preview?.image?.url ||
      undefined;

    const available =
      typeof node.totalInventory === "number"
        ? node.totalInventory > 0
        : typeof firstVariant?.inventoryQuantity === "number"
        ? firstVariant.inventoryQuantity > 0
        : true;

    return {
      id: node.id,
      title: node.title,
      price: firstVariant?.price ? Number(firstVariant.price) : undefined,
      image,
      available,
      description: node.description || "",
      productType: node.productType || "",
      tags: node.tags || [],
      vendor: node.vendor || "",
      url: `https://${process.env.SHOPIFY_STORE_DOMAIN}/products/${node.handle}`,
    };
  });
}

function scoreProducts(
  products: ProductCard[],
  input: ReturnType<typeof deriveSearchBody>
) {
  const queryLower = input.query.toLowerCase();

  return products
    .filter((p) => {
      if (
        typeof input.filters.minPrice === "number" &&
        typeof p.price === "number" &&
        p.price < input.filters.minPrice
      ) {
        return false;
      }

      if (
        typeof input.filters.maxPrice === "number" &&
        typeof p.price === "number" &&
        p.price > input.filters.maxPrice
      ) {
        return false;
      }

      if (input.filters.available && p.available === false) {
        return false;
      }

      return true;
    })
    .map((p) => {
      let score = 0;
      const title = p.title.toLowerCase();

const description = (p.description || "").toLowerCase();

const tags = Array.isArray(p.tags)
  ? p.tags.join(" ").toLowerCase()
  : "";

const productType = (p.productType || "").toLowerCase();

const searchable = [
  title,
  description,
  tags,
  productType,
].join(" ");

      if (queryLower && title.includes(queryLower)) score += 10;

      for (const keyword of input.keywords) {
  const k = keyword.toLowerCase();

  if (title.includes(k)) score += 10;

  if (tags.includes(k)) score += 12;

  if (productType.includes(k)) score += 8;

  if (description.includes(k)) score += 4;
}

for (const category of input.filters.categories ?? []) {
  const c = category.toLowerCase();

  if (title.includes(c)) score += 12;

  if (tags.includes(c)) score += 14;

  if (productType.includes(c)) score += 10;
}

const matchedKeywords = input.keywords.filter((k) =>
  searchable.includes(k.toLowerCase())
).length;

score += matchedKeywords * 5;

if (input.keywords.length >= 2 && matchedKeywords < 2) {
  score -= 20;
}

      if (p.available) score += 2;
      if (typeof p.price === "number") score += 1;

      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, input.keywords.length >= 2 ? Math.min(input.limit, 3) : input.limit)
    .map(({ _score, ...p }) => p);
}

export async function POST(req: Request) {
  const internalSecret =
    req.headers.get("x-tikozap-internal-secret") || "";

  if (
    !SHOPIFY_SEARCH_INTERNAL_SECRET ||
    internalSecret !== SHOPIFY_SEARCH_INTERNAL_SECRET
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const rl = checkRateLimit(req, {
      namespace: 'shopify-search',
      limit: 30,
      windowMs: 60_000,
    });

    if (!rl.ok) {
      return NextResponse.json(
        {
          error: 'Too many product searches. Please try again shortly.',
        },
        {
          status: 429,
          headers: rateLimitHeaders(rl),
        }
      );
    }

    const body = (await req.json()) as SearchBody;
    const input = deriveSearchBody(body);
    const query = buildShopifyQuery(input);

    if (!query) {
      return NextResponse.json({
        products: [],
        search: {
          query: "",
          keywords: [],
          filters: input.filters,
        },
      });
    }

    const raw = await shopifyAdminGraphQL<ShopifySearchResponse>(
      PRODUCTS_QUERY,
      {
        first: Math.max(input.limit * 2, 8),
        query,
      }
    );

    const products = normalizeProducts(raw);
    const scored = scoreProducts(products, input);

    return NextResponse.json({
      products: scored,
      search: {
        query,
        keywords: input.keywords,
        filters: input.filters,
      },
    });
  } catch (error: any) {
    console.error("SHOPIFY_SEARCH_ERROR", error);

return NextResponse.json(
  {
    error: 'Shopify search failed',
  },
      { status: 500 }
    );
  }
}