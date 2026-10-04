// src/lib/providers/shopifyProductProvider.ts

import "server-only";

import type { ProductProvider } from "@/lib/productProvider";
import type { ProductSearchResult } from "@/lib/brain/types";

type ShopifyProviderConfig = {
  shopDomain: string;
  adminAccessToken: string;
  apiVersion?: string | null;
};

type ShopifyProductsResponse = {
  data?: {
    products?: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          description?: string | null;
          productType?: string | null;
          tags?: string[];
          vendor?: string | null;
          totalInventory?: number | null;
          featuredMedia?: {
            preview?: {
              image?: {
                url?: string | null;
              } | null;
            } | null;
          } | null;
          variants?: {
            edges: Array<{
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

function normalizeShopDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export function createShopifyProductProvider(
  config: ShopifyProviderConfig
): ProductProvider {
  const shopDomain = normalizeShopDomain(config.shopDomain);
  const apiVersion = config.apiVersion?.trim() || "2026-01";
  const adminAccessToken = config.adminAccessToken.trim();

  if (!shopDomain) {
    throw new Error("Missing Shopify shop domain");
  }

  if (!adminAccessToken) {
    throw new Error("Missing Shopify Admin API access token");
  }

  return {
    async searchProducts(query, options) {
      const limit = options?.limit ?? 12;

      const response = await fetch(
        `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminAccessToken,
          },
          body: JSON.stringify({
            query: PRODUCTS_QUERY,
            variables: {
              first: limit,
              query: `${query} status:active`,
            },
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          `Shopify request failed: ${response.status} ${text}`
        );
      }

      const json =
        (await response.json()) as ShopifyProductsResponse;

      if (json.errors?.length) {
        throw new Error(
          json.errors.map((error) => error.message).join("; ")
        );
      }

      const edges = json.data?.products?.edges ?? [];

      return edges.map(({ node }): ProductSearchResult => {
        const firstVariant = node.variants?.edges?.[0]?.node;

        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          description: node.description || "",
          productType: node.productType || "",
          tags: node.tags || [],
          vendor: node.vendor || "",
          price: firstVariant?.price
            ? Number(firstVariant.price)
            : undefined,
          image:
            node.featuredMedia?.preview?.image?.url ||
            undefined,
          available:
            typeof node.totalInventory === "number"
              ? node.totalInventory > 0
              : typeof firstVariant?.inventoryQuantity ===
                  "number"
                ? firstVariant.inventoryQuantity > 0
                : true,
          url: `https://${shopDomain}/products/${node.handle}`,
        } as ProductSearchResult;
      });
    },
  };
}