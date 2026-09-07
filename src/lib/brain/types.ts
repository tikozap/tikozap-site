// src/lib/brain/types.ts

export type IntentType =
  | "product_search"
  | "product_advice"
  | "store_question"
  | "general_chat"
  | "unknown";

export type UserImageInput = {
  url?: string;
  dataUrl?: string;
  base64?: string;
  mimeType?: string;
};

export type UserTurnInput = {
  text?: string;
  images?: UserImageInput[];
};

export type VisionContext = {
  category?: string;
  color?: string;
  pattern?: string;
  style?: string;
  material?: string;
  useCase?: string;
  keywords?: string[];
  confidence?: number;
  notes?: string;
  unclear?: boolean;
};

export type MergedIntent = {
  type: IntentType;
  userGoal: string;
  wantsProductSearch: boolean;
  wantsAdvice: boolean;
  priceMax?: number;
  priceMin?: number;
  color?: string;
  category?: string;
  style?: string;
  keywords: string[];
};

export type ProductSearchQuery = {
  query: string;
  keywords: string[];
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    colors?: string[];
    categories?: string[];
    available?: boolean;
  };
};

export type ProductSearchResult = {
  id: string | number;
  title?: string;
  handle?: string;
  price?: number | string;
  image?: string | null;
  available?: boolean;
};

export type BrainResult = {
  reply: string;
  visionContext: VisionContext | null;
  mergedIntent: MergedIntent;
  productSearchQuery: ProductSearchQuery | null;
  products: ProductSearchResult[];
};