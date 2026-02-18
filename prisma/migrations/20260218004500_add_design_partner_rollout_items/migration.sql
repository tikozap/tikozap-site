-- CreateTable
CREATE TABLE "DesignPartnerRolloutItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "owner" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DesignPartnerRolloutItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignPartnerRolloutItem_tenantId_key_key" ON "DesignPartnerRolloutItem"("tenantId", "key");
CREATE INDEX "DesignPartnerRolloutItem_tenantId_done_idx" ON "DesignPartnerRolloutItem"("tenantId", "done");
