-- Track whether a tenant has completed initial onboarding.

ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS
  "onboardingCompletedAt" TIMESTAMP(3);

-- Preserve all existing stores so they do not see
-- onboarding again after this feature is introduced.
UPDATE "Tenant"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "onboardingCompletedAt" IS NULL;