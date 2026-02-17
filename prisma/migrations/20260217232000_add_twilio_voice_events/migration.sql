-- CreateTable
CREATE TABLE "TwilioVoiceEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'twilio',
    "eventType" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "callSid" TEXT,
    "accountSid" TEXT,
    "streamSid" TEXT,
    "mos" REAL,
    "jitterMs" REAL,
    "packetLossPct" REAL,
    "roundTripMs" REAL,
    "rawPayload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TwilioVoiceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TwilioVoiceEvent_tenantId_createdAt_idx" ON "TwilioVoiceEvent"("tenantId", "createdAt");
CREATE INDEX "TwilioVoiceEvent_callSid_createdAt_idx" ON "TwilioVoiceEvent"("callSid", "createdAt");
CREATE INDEX "TwilioVoiceEvent_eventType_createdAt_idx" ON "TwilioVoiceEvent"("eventType", "createdAt");
