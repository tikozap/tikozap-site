// src/lib/demoBrain.ts

export type SearchState = {
  lastQuery?: string;
  minPrice?: number;
  maxPrice?: number;
};

export function extractSearchIntent(text: string) {
  const lower = text.toLowerCase();

  let query = "";
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  // --- extract price ---
  const overMatch = lower.match(/over\s*\$?(\d+)/);
  const underMatch = lower.match(/under\s*\$?(\d+)/);

  if (overMatch) {
    minPrice = Number(overMatch[1]);
  }

  if (underMatch) {
    maxPrice = Number(underMatch[1]);
  }

  // --- extract category (very simple but powerful) ---
  // remove price phrases
  const cleaned = lower
    .replace(/over\s*\$?\d+/g, "")
    .replace(/under\s*\$?\d+/g, "")
    .replace(/show|find|recommend|me|some/g, "")
    .trim();

  query = cleaned || lower;

  return {
    type: "product_search" as const,
    query,
    minPrice,
    maxPrice,
  };
}

export function mergeSearchState(
  prev: SearchState,
  next: ReturnType<typeof extractSearchIntent>
): SearchState {
  return {
    lastQuery: next.query || prev.lastQuery,
    minPrice: next.minPrice ?? prev.minPrice,
    maxPrice: next.maxPrice ?? prev.maxPrice,
  };
}