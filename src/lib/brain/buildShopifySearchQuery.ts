// src/lib/brain/buildShopifySearchQuery.ts

import type { MergedIntent, ProductSearchQuery } from "./types";

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().replace(/[^\w\s-]/g, "").trim();
}

function singularize(word: string): string {
  if (word.endsWith("boards")) return word.slice(0, -1);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function buildShopifySearchQuery(
  intent: MergedIntent
): ProductSearchQuery | null {
  if (!intent.wantsProductSearch) return null;

  const stopWords = new Set([
    "show",
    "me",
    "find",
    "something",
    "some",
    "like",
    "this",
    "do",
    "you",
    "have",
    "looking",
    "for",
    "in",
    "the",
    "a",
    "an",
    "now",
    "please",
    "can",
    "could",
    "want",
    "any",
    "what",
    "under",
    "over",
    "below",
    "above",
    "cheap",
    "cheaper",
    "expensive",
    "price",
    "color",
    "one",
    "ones",
    "between",
    "and",
  ]);

  const cleanedKeywords = intent.keywords
    .map(normalizeKeyword)
    .filter(Boolean)
    .filter((k: any) => !stopWords.has(k))
    .filter((k: any) => !/^\d+$/.test(k))
    .map(singularize);

  const parts = [
    intent.category ? singularize(normalizeKeyword(intent.category)) : undefined,
    intent.color ? normalizeKeyword(intent.color) : undefined,
    intent.style ? normalizeKeyword(intent.style) : undefined,
    ...cleanedKeywords.slice(0, 4),
  ].filter(Boolean) as string[];

  const deduped = Array.from(new Set(parts));

  return {
    query: deduped.join(" ").trim() || intent.userGoal,
    keywords: deduped,
    filters: {
      minPrice: intent.priceMin,
      maxPrice: intent.priceMax,
      colors: intent.color ? [intent.color] : undefined,
      categories: intent.category ? [intent.category] : undefined,
      available: true,
    },
  };
}