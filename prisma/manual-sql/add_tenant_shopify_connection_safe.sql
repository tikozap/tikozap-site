CREATE TABLE "ShopifyConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "adminAccessTokenEncrypted" TEXT NOT NULL,
    "apiVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopifyConnection_tenantId_key"
ON "ShopifyConnection"("tenantId");

CREATE UNIQUE INDEX "ShopifyConnection_shopDomain_key"
ON "ShopifyConnection"("shopDomain");

CREATE INDEX "ShopifyConnection_status_idx"
ON "ShopifyConnection"("status");

ALTER TABLE "ShopifyConnection"
ADD CONSTRAINT "ShopifyConnection_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
