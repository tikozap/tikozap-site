// src/lib/usage.ts
import { prisma } from "@/lib/prisma";

type UsageDelta = Partial<{
  messages: number;
  conversations: number;
  knowledgeChars: number;
}>;

export function getYearMonth(date = new Date(), timeZone = "UTC"): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;

  if (!year || !month) throw new Error("Failed to compute yearMonth");
  return parseInt(`${year}${month}`, 10);
}

/**
 * Increment usage counters for the tenant’s current month.
 * Pass tenant timeZone from Tenant.timeZone (e.g. "America/New_York").
 */
export async function incrementUsageMonth(
  tenantId: string,
  timeZone: string,
  delta: UsageDelta
) {
  const yearMonth = getYearMonth(new Date(), timeZone || "UTC");

  await prisma.usageMonth.upsert({
    where: { tenantId_yearMonth: { tenantId, yearMonth } },
    create: {
      tenantId,
      yearMonth,
      messages: delta.messages ?? 0,
      conversations: delta.conversations ?? 0,
      knowledgeChars: delta.knowledgeChars ?? 0,
    },
    update: {
      messages: delta.messages ? { increment: delta.messages } : undefined,
      conversations: delta.conversations ? { increment: delta.conversations } : undefined,
      knowledgeChars: delta.knowledgeChars ? { increment: delta.knowledgeChars } : undefined,
    },
  });
}
