// src/lib/resolveProductProvider.ts

import "server-only";

import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/credentialEncryption";
import type { ProductProvider } from "@/lib/productProvider";
import { createShopifyProductProvider } from "@/lib/providers/shopifyProductProvider";

export async function resolveProductProvider(
  tenantId: string
): Promise<ProductProvider | null> {
  const connection =
    await prisma.shopifyConnection.findUnique({
      where: {
        tenantId,
      },
      select: {
        shopDomain: true,
        adminAccessTokenEncrypted: true,
        apiVersion: true,
        status: true,
      },
    });

  if (!connection) {
    return null;
  }

  if (connection.status !== "connected") {
    return null;
  }

  const adminAccessToken = decryptCredential(
    connection.adminAccessTokenEncrypted
  );

  return createShopifyProductProvider({
    shopDomain: connection.shopDomain,
    adminAccessToken,
    apiVersion: connection.apiVersion,
  });
}