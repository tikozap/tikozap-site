// src/lib/revenueEstimate.ts

export type ShopifyStoreSummary = {
  storeName: string;
  currency: string;
  recentRevenue30d: number;
  recentOrders30d: number;
  averageOrderValue30d: number;
  productCount: number;
  topProducts: Array<{
    id: string;
    title: string;
    revenue?: number;
  }>;
};

export type RevenueEstimate = {
  baselineRevenue: number;
  conservativeGain: number;
  expectedGain: number;
  strongGain: number;
  notes: string[];
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function estimateRevenueImpact(
  summary: ShopifyStoreSummary
): RevenueEstimate {
  const baselineRevenue = summary.recentRevenue30d || 0;

  const conservativeGain = baselineRevenue * 0.08;
  const expectedGain = baselineRevenue * 0.12;
  const strongGain = baselineRevenue * 0.18;

  const notes: string[] = [
    "Estimate based on recent 30-day store performance.",
    "Assumes improved conversion, lower drop-off, and modest upsell lift.",
    "This is an estimate, not a guarantee.",
  ];

  return {
    baselineRevenue: roundMoney(baselineRevenue),
    conservativeGain: roundMoney(conservativeGain),
    expectedGain: roundMoney(expectedGain),
    strongGain: roundMoney(strongGain),
    notes,
  };
}