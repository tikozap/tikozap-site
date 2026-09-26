UPDATE "Tenant"
SET
  "trialStartedAt" = COALESCE("createdAt", NOW()),
  "trialEndsAt" = COALESCE("createdAt", NOW()) + INTERVAL '14 days'
WHERE
  "billingStatus" = 'trialing'
  AND "trialEndsAt" IS NULL;