-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "starterLinkEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Tenant" ADD COLUMN "starterLinkSlug" TEXT;

-- CreateTable
CREATE TABLE "MetricEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "source" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "intent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_starterLinkSlug_key" ON "Tenant"("starterLinkSlug");
CREATE INDEX "MetricEvent_tenantId_createdAt_idx" ON "MetricEvent"("tenantId", "createdAt");
CREATE INDEX "MetricEvent_event_createdAt_idx" ON "MetricEvent"("event", "createdAt");
