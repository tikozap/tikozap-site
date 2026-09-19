// src/lib/productProvider.ts

import type { ProductSearchResult } from "@/lib/brain/types";
import {
  normalizeShopifyProducts,
  shopifyAdminGraphQL,
} from "@/lib/shopify";

export type ProductProvider = {
  searchProducts: (
    query: string,
    options?: {
      limit?: number;
    }
  ) => Promise<ProductSearchResult[]>;
};

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

export const globalShopifyProductProvider: ProductProvider = {
  async searchProducts(query, options) {
    const limit = options?.limit ?? 12;

    const raw = await shopifyAdminGraphQL(PRODUCTS_QUERY, {
      first: limit,
      query: `${query} status:active`,
    });

    console.log(
      "SHOPIFY_SEARCH",
      query,
      (raw as any)?.products?.edges?.map(
        (edge: any) => edge.node.title
      )
    );

    return normalizeShopifyProducts(raw as any);
  },
};