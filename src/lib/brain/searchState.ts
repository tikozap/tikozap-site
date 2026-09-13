// src/lib/brain/searchState.ts

export type SearchState = {
  lastQuery?: string;
  lastCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sortIntent?: "cheaper" | "expensive" | "none";
};

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();

  if (lower.includes("dress") || lower.includes("dresses")) return "dress";
  if (lower.includes("jacket") || lower.includes("jackets")) return "jacket";
  if (lower.includes("bag") || lower.includes("bags") || lower.includes("purse")) return "bag";
  if (lower.includes("sneaker") || lower.includes("sneakers") || lower.includes("shoe") || lower.includes("shoes")) return "sneaker";
  if (lower.includes("snowboard") || lower.includes("snowboards")) return "snowboard";
  if (lower.includes("bike") || lower.includes("bikes") || lower.includes("bicycle") || lower.includes("bicycles")) return "bike";

  return undefined;
}

export function extractSearchIntent(text: string) {
  const lower = text.toLowerCase();

  let query = "";
  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  let sortIntent: SearchState["sortIntent"] = "none";

  const betweenMatch = lower.match(/between\s*\$?(\d+)\s*(?:and|-)\s*\$?(\d+)/);
  const overMatch = lower.match(/(?:over|above|more than|how about over|what about over)\s*\$?(\d+)/);
  const underMatch = lower.match(/(?:under|below|less than|up to|how about under|what about under|maybe under)\s*\$?(\d+)/);

  if (betweenMatch) {
    minPrice = Number(betweenMatch[1]);
    maxPrice = Number(betweenMatch[2]);
  } else {
    if (overMatch) minPrice = Number(overMatch[1]);
    if (underMatch) maxPrice = Number(underMatch[1]);
  }

  if (
    lower.includes("cheaper") ||
    lower.includes("less expensive") ||
    lower.includes("lower price") ||
    lower.includes("budget")
  ) {
    sortIntent = "cheaper";
  }

  if (
    lower.includes("expensive") ||
    lower.includes("premium") ||
    lower.includes("higher end") ||
    lower.includes("high end")
  ) {
    sortIntent = "expensive";
  }

  const category = detectCategory(lower);

  const cleaned = lower
    .replace(/between\s*\$?\d+\s*(?:and|-)\s*\$?\d+/g, "")
    .replace(/(?:over|above|more than)\s*\$?\d+/g, "")
    .replace(/(?:under|below|less than|up to)\s*\$?\d+/g, "")
    .replace(/\b(show|find|recommend|me|some|do|you|have|any|please|ones|one|instead)\b/g, "")
    .replace(/\b(cheaper|less expensive|lower price|budget|expensive|premium|higher end|high end)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

 if (
  !cleaned &&
  !category &&
  (sortIntent !== "none" || minPrice !== undefined || maxPrice !== undefined)
) {
  query = "";
} else {
  query = cleaned || category || lower;
}

  return {
    type: "product_search" as const,
    query,
    category,
    minPrice,
    maxPrice,
    sortIntent,
  };
}

export function mergeSearchState(
  prev: SearchState,
  next: ReturnType<typeof extractSearchIntent>
): SearchState {
  const nextQuery =
    next.query && next.query.length > 1
      ? next.query
      : prev.lastQuery;

const categoryChanged =
  next.category &&
  next.category !== prev.lastCategory;

return {
  lastQuery:
    categoryChanged
      ? next.category
      : nextQuery || prev.lastQuery,

  lastCategory:
    categoryChanged
      ? next.category
      : next.category || prev.lastCategory,
    minPrice: next.minPrice ?? prev.minPrice,
    maxPrice: next.maxPrice ?? prev.maxPrice,
    sortIntent:
      next.sortIntent && next.sortIntent !== "none"
        ? next.sortIntent
        : prev.sortIntent,
  };
}