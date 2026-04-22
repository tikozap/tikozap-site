// src/lib/brain/orchestrateTurn.ts
import { buildShopifySearchQuery } from "./buildShopifySearchQuery";
import { composeAnswer } from "./composeAnswer";
import { extractVisionContext } from "./extractVisionContext";
import { mergeUserIntent } from "./mergeUserIntent";
import type {
  BrainResult,
  ProductSearchResult,
  UserTurnInput,
} from "./types";

type OrchestrateDeps = {
  searchProducts?: (query: {
    query?: string;
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      colors?: string[];
      categories?: string[];
      available?: boolean;
    };
    keywords?: string[];
  }) => Promise<ProductSearchResult[]>;
};

export async function orchestrateTurn(
  input: UserTurnInput,
  deps: OrchestrateDeps = {}
): Promise<BrainResult> {
  const hasImages = !!input.images?.length;

  const visionContext = hasImages
    ? await extractVisionContext({
        images: input.images || [],
        text: input.text,
      })
    : null;

  const mergedIntent = mergeUserIntent(input, visionContext);
  const productSearchQuery = buildShopifySearchQuery(mergedIntent);

  let products: ProductSearchResult[] = [];

  if (productSearchQuery && deps.searchProducts) {
    try {
      products = await deps.searchProducts(productSearchQuery);
    } catch (error) {
      console.error("[brain] product search failed", error);
    }
  }

  const reply = composeAnswer({
    text: input.text,
    visionContext,
    mergedIntent,
    products,
  });

  return {
    reply,
    visionContext,
    mergedIntent,
    productSearchQuery,
    products,
  };
}