-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Conversation_tenantId_archivedAt_idx" ON "Conversation"("tenantId", "archivedAt");
