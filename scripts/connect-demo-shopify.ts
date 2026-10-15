// scripts/connect-demo-shopify.ts

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const tenantId = process.argv[2]?.trim();

  if (!tenantId) {
    throw new Error(
      [
        "Missing tenant ID.",
        "",
        "Usage:",
        "npx tsx scripts/connect-demo-shopify.ts <TENANT_ID>",
      ].join("\n")
    );
  }

  const shopDomain =
    process.env.SHOPIFY_STORE_DOMAIN?.trim();

  const adminAccessToken =
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();

  const apiVersion =
    process.env.SHOPIFY_API_VERSION?.trim() || null;

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }

  if (!shopDomain) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  }

  if (!adminAccessToken) {
    throw new Error(
      "Missing SHOPIFY_ADMIN_ACCESS_TOKEN"
    );
  }

  if (
    !process.env
      .TIKOZAP_CREDENTIAL_ENCRYPTION_KEY
  ) {
    throw new Error(
      "Missing TIKOZAP_CREDENTIAL_ENCRYPTION_KEY"
    );
  }

  const [{ prisma }, { connectShopifyStore }] =
    await Promise.all([
      import("../src/lib/prisma"),
      import("../src/lib/shopifyConnectionCore"),
    ]);

  try {
    const tenant =
      await prisma.tenant.findUnique({
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

    console.log("");
    console.log("Connecting Shopify store...");
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Shop: ${shopDomain}`);

    const connection =
      await connectShopifyStore({
        tenantId,
        shopDomain,
        adminAccessToken,
        apiVersion,
      });

    console.log("");
    console.log(
      "Shopify connection saved successfully."
    );

    console.log({
      tenantId: connection.tenantId,
      shopDomain: connection.shopDomain,
      status: connection.status,
      apiVersion: connection.apiVersion,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error("Connection failed:");
  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exitCode = 1;
});