-- CreateTable
CREATE TABLE "StarterLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "tagline" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "hoursJson" TEXT,
    "buttonsJson" TEXT,
    "greeting" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StarterLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StarterLink_tenantId_key" ON "StarterLink"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StarterLink_slug_key" ON "StarterLink"("slug");

-- CreateIndex
CREATE INDEX "StarterLink_published_idx" ON "StarterLink"("published");
