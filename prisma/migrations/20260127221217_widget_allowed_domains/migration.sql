-- AlterTable
ALTER TABLE "Widget" ADD COLUMN     "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
