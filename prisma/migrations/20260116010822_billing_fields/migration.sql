-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('STARTER', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "billingStatus" "BillingStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'PRO',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
