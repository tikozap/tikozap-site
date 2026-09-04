// src/lib/providers/starterLinkProductProvider.ts

import "server-only";

import type { ProductProvider } from "@/lib/productProvider";
import type { ProductSearchResult } from "@/lib/brain/types";

type StarterProduct = {
  title?: string;
  price?: string;
  image?: string;
};

type StarterLinkProductProviderConfig = {
  bestSellerJson?: string | null;
  productsJson?: string | null;
};

function parseProduct(value: unknown): StarterProduct | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const product = value as Record<string, unknown>;

  const title =
    typeof product.title === "string"
      ? product.title.trim()
      : "";

  if (!title) {
    return null;
  }

  return {
    title,
    price:
      typeof product.price === "string"
        ? product.price.trim()
        : "",
    image:
      typeof product.image === "string"
        ? product.image.trim()
        : "",
  };
}

function parseJsonProducts(
  bestSellerJson?: string | null,
  productsJson?: string | null
): StarterProduct[] {
  const products: StarterProduct[] = [];

  if (bestSellerJson) {
    try {
      const parsed = JSON.parse(bestSellerJson);
      const product = parseProduct(parsed);

      if (product) {
        products.push(product);
      }
    } catch {
      // Ignore malformed stored product JSON.
    }
  }

  if (productsJson) {
    try {
      const parsed = JSON.parse(productsJson);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const product = parseProduct(item);

          if (product) {
            products.push(product);
          }
        }
      }
    } catch {
      // Ignore malformed stored product JSON.
    }
  }

  const deduped = new Map<string, StarterProduct>();

  for (const product of products) {
    const key = `${product.title?.toLowerCase()}|${product.price || ""}`;

    if (!deduped.has(key)) {
      deduped.set(key, product);
    }
  }

  return Array.from(deduped.values());
}

function normalizeWords(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function createStarterLinkProductProvider(
  config: StarterLinkProductProviderConfig
): ProductProvider {
  const products = parseJsonProducts(
    config.bestSellerJson,
    config.productsJson
  );

  return {
    async searchProducts(query, options) {
      const limit = options?.limit ?? 12;

      const queryWords = normalizeWords(query);

      if (queryWords.length === 0) {
        return [];
      }

      const matches = products.filter((product) => {
        const title = product.title?.toLowerCase() || "";

        return queryWords.every((word) =>
          title.includes(word)
        );
      });

return matches.slice(0, limit).map(
  (product): ProductSearchResult => {
    const stableKey = `${product.title || ""}|${product.price || ""}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      id: `starter-link-${stableKey}`,
      title: product.title,
      price: product.price || undefined,
      image: product.image || undefined,
    };
  }
);
    },
  };
}