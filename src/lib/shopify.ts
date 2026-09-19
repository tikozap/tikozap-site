// src/lib/shopify.ts

type ShopifyProductNode = {
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

type ShopifyProductsResponse = {
  data?: {
    products?: {
      edges: Array<{
        node: ShopifyProductNode;
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-01";

  if (!domain) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  }
  if (!token) {
    throw new Error("Missing SHOPIFY_ADMIN_ACCESS_TOKEN");
  }

  return { domain, token, version };
}

export async function shopifyAdminGraphQL<T>(
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

  const json = (await res.json()) as T;
  return json;
}

export function normalizeShopifyProducts(json: ShopifyProductsResponse) {
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: any) => e.message).join("; "));
  }

  const edges = json.data?.products?.edges ?? [];

  return edges.map(({ node }: any) => {
    const firstVariant = node.variants?.edges?.[0]?.node;

return {
  id: node.id,
  title: node.title,
  handle: node.handle,
  description: node.description || "",
  productType: node.productType || "",
  tags: node.tags || [],
  vendor: node.vendor || "",
  price: firstVariant?.price ? Number(firstVariant.price) : undefined,
  image: node.featuredMedia?.preview?.image?.url || undefined,
  available:
    typeof node.totalInventory === "number"
      ? node.totalInventory > 0
      : typeof firstVariant?.inventoryQuantity === "number"
      ? firstVariant.inventoryQuantity > 0
      : true,
  url: `https://${process.env.SHOPIFY_STORE_DOMAIN}/products/${node.handle}`,
};
  });
}