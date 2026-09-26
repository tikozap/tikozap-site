// src/lib/shopifyConnectionCore.ts

import { prisma } from "@/lib/prisma";
import {
  encryptCredential,
} from "@/lib/credentialEncryptionCore";

export type ConnectShopifyStoreInput = {
  tenantId: string;
  shopDomain: string;
  adminAccessToken: string;
  apiVersion?: string | null;
};

function normalizeShopDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

export async function connectShopifyStore(
  input: ConnectShopifyStoreInput
) {
  const tenantId = input.tenantId.trim();
  const shopDomain = normalizeShopDomain(
    input.shopDomain
  );
  const adminAccessToken =
    input.adminAccessToken.trim();
  const apiVersion =
    input.apiVersion?.trim() || null;

  if (!tenantId) {
    throw new Error("Missing tenant ID");
  }

  if (!shopDomain) {
    throw new Error("Missing Shopify shop domain");
  }

  if (!adminAccessToken) {
    throw new Error(
      "Missing Shopify Admin API access token"
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!tenant) {
    throw new Error(
      `Tenant not found: ${tenantId}`
    );
  }

  const adminAccessTokenEncrypted =
    encryptCredential(adminAccessToken);

  return prisma.shopifyConnection.upsert({
    where: {
      tenantId,
    },
    create: {
      tenantId,
      shopDomain,
      adminAccessTokenEncrypted,
      apiVersion,
      status: "connected",
      connectedAt: new Date(),
      disconnectedAt: null,
    },
    update: {
      shopDomain,
      adminAccessTokenEncrypted,
      apiVersion,
      status: "connected",
      connectedAt: new Date(),
      disconnectedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      shopDomain: true,
      apiVersion: true,
      status: true,
      connectedAt: true,
      disconnectedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function disconnectShopifyStore(
  tenantIdValue: string
) {
  const tenantId = tenantIdValue.trim();

  if (!tenantId) {
    throw new Error("Missing tenant ID");
  }

  const existing =
    await prisma.shopifyConnection.findUnique({
      where: {
        tenantId,
      },
      select: {
        id: true,
      },
    });

  if (!existing) {
    return null;
  }

  return prisma.shopifyConnection.update({
    where: {
      tenantId,
    },
    data: {
      status: "disconnected",
      disconnectedAt: new Date(),
    },
    select: {
      id: true,
      tenantId: true,
      shopDomain: true,
      apiVersion: true,
      status: true,
      connectedAt: true,
      disconnectedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getShopifyConnection(
  tenantIdValue: string
) {
  const tenantId = tenantIdValue.trim();

  if (!tenantId) {
    throw new Error("Missing tenant ID");
  }

  return prisma.shopifyConnection.findUnique({
    where: {
      tenantId,
    },
    select: {
      id: true,
      tenantId: true,
      shopDomain: true,
      apiVersion: true,
      status: true,
      connectedAt: true,
      disconnectedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}