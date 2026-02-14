/*
  Warnings:

  - A unique constraint covering the columns `[inboundNumberE164]` on the table `PhoneAgentSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PhoneAgentSettings" ADD COLUMN     "inboundNumberE164" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PhoneAgentSettings_inboundNumberE164_key" ON "PhoneAgentSettings"("inboundNumberE164");
