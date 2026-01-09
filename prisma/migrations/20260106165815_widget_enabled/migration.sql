-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Widget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installedAt" DATETIME,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "assistantName" TEXT,
    "greeting" TEXT,
    "brandColor" TEXT,
    CONSTRAINT "Widget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Widget" ("assistantName", "brandColor", "createdAt", "greeting", "id", "installedAt", "publicKey", "tenantId") SELECT "assistantName", "brandColor", "createdAt", "greeting", "id", "installedAt", "publicKey", "tenantId" FROM "Widget";
DROP TABLE "Widget";
ALTER TABLE "new_Widget" RENAME TO "Widget";
CREATE UNIQUE INDEX "Widget_tenantId_key" ON "Widget"("tenantId");
CREATE UNIQUE INDEX "Widget_publicKey_key" ON "Widget"("publicKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
