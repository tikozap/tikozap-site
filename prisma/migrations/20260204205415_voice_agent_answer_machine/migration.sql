-- CreateEnum
CREATE TYPE "CallProvider" AS ENUM ('TWILIO');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnswerMachineType" AS ENUM ('VOICEMAIL', 'CALLBACK');

-- CreateEnum
CREATE TYPE "AnswerMachineStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "PhoneAgentSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "voiceName" TEXT,
    "greeting" TEXT,
    "fallbackLine" TEXT,
    "afterHoursLine" TEXT,
    "afterHoursVoicemailOnly" BOOLEAN NOT NULL DEFAULT true,
    "businessHoursJson" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneAgentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "CallProvider" NOT NULL DEFAULT 'TWILIO',
    "providerCallSid" TEXT NOT NULL,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "status" "CallStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "conversationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "fallbackTriggeredAt" TIMESTAMP(3),

    CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallTurn" (
    "id" TEXT NOT NULL,
    "callSessionId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "sttText" TEXT,
    "assistantText" TEXT,
    "sttMs" INTEGER,
    "llmMs" INTEGER,
    "ttsMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerMachineItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "AnswerMachineType" NOT NULL,
    "status" "AnswerMachineStatus" NOT NULL DEFAULT 'NEW',
    "callSessionId" TEXT,
    "conversationId" TEXT NOT NULL,
    "fromNumber" TEXT,
    "recordingUrl" TEXT,
    "transcriptText" TEXT,
    "callbackNumber" TEXT,
    "callbackNotes" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerMachineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneAgentSettings_tenantId_key" ON "PhoneAgentSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CallSession_providerCallSid_key" ON "CallSession"("providerCallSid");

-- CreateIndex
CREATE INDEX "CallSession_tenantId_startedAt_idx" ON "CallSession"("tenantId", "startedAt");

-- CreateIndex
CREATE INDEX "CallTurn_callSessionId_createdAt_idx" ON "CallTurn"("callSessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallTurn_callSessionId_idx_key" ON "CallTurn"("callSessionId", "idx");

-- CreateIndex
CREATE INDEX "AnswerMachineItem_tenantId_status_createdAt_idx" ON "AnswerMachineItem"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AnswerMachineItem_conversationId_idx" ON "AnswerMachineItem"("conversationId");

-- AddForeignKey
ALTER TABLE "PhoneAgentSettings" ADD CONSTRAINT "PhoneAgentSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTurn" ADD CONSTRAINT "CallTurn_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerMachineItem" ADD CONSTRAINT "AnswerMachineItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerMachineItem" ADD CONSTRAINT "AnswerMachineItem_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerMachineItem" ADD CONSTRAINT "AnswerMachineItem_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
