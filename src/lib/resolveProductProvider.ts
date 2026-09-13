// src/lib/resolveProductProvider.ts

import "server-only";

import { prisma } from "@/lib/prisma";

import { decryptCredential } from "@/lib/credentialEncryption";

import type { ProductProvider } from "@/lib/productProvider";

import { createShopifyProductProvider } from "@/lib/providers/shopifyProductProvider";

import { createStarterLinkProductProvider } from "@/lib/providers/starterLinkProductProvider";

export async function resolveProductProvider(
  tenantId: string
): Promise<ProductProvider | null> {
  const [connection, starterLinkPage] = await Promise.all([
    prisma.shopifyConnection.findUnique({
      where: {
        tenantId,
      },
      select: {
        shopDomain: true,
        adminAccessTokenEncrypted: true,
        apiVersion: true,
        status: true,
      },
    }),

    prisma.starterLinkPage.findUnique({
      where: {
        tenantId,
      },
      select: {
        bestSellerJson: true,
        productsJson: true,
      },
    }),
  ]);

  const providers: ProductProvider[] = [];

  if (starterLinkPage) {
    providers.push(
      createStarterLinkProductProvider({
        bestSellerJson: starterLinkPage.bestSellerJson,
        productsJson: starterLinkPage.productsJson,
      })
    );
  }

  if (connection?.status === "connected") {
    const adminAccessToken = decryptCredential(
      connection.adminAccessTokenEncrypted
    );

    providers.push(
      createShopifyProductProvider({
        shopDomain: connection.shopDomain,
        adminAccessToken,
        apiVersion: connection.apiVersion,
      })
    );
  }

  if (providers.length === 0) {
    return null;
  }

  if (providers.length === 1) {
    return providers[0];
  }

  return {
    async searchProducts(query, options) {
      const results = await Promise.all(
        providers.map(async (provider) => {
          try {
            return await provider.searchProducts(query, options);
          } catch (error) {
            console.error(
              "[resolveProductProvider] Product source search failed:",
              error
            );

            return [];
          }
        })
      );

      const deduped = new Map<
        string,
        Awaited<
          ReturnType<ProductProvider["searchProducts"]>
        >[number]
      >();

      for (const sourceResults of results) {
        for (const product of sourceResults) {
          const title =
            typeof product.title === "string"
              ? product.title.trim().toLowerCase()
              : "";

          const price =
            product.price == null
              ? ""
              : String(product.price).trim().toLowerCase();

          const key = title
            ? `${title}|${price}`
            : String(product.id);

          if (!deduped.has(key)) {
            deduped.set(key, product);
          }
        }
      }

      return Array.from(deduped.values()).slice(
        0,
        options?.limit ?? 12
      );
    },
  };
}