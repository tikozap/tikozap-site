// src/app/api/demo/revenue-estimate/route.ts

import { NextResponse } from "next/server";
import {
  estimateRevenueImpact,
  type ShopifyStoreSummary,
} from "@/lib/revenueEstimate";
import { shopifyAdminGraphQL } from "@/lib/shopify";

export const runtime = "nodejs";

type RevenueEstimateResponse = {
  data?: {
    shop?: {
      name?: string;
      currencyCode?: string;
    };
    products?: {
      edges?: Array<{
        node: {
          id: string;
          title: string;
        };
      }>;
    };
    orders?: {
      edges?: Array<{
        node: {
          id: string;
          createdAt: string;
          currentTotalPriceSet?: {
            shopMoney?: {
              amount?: string;
              currencyCode?: string;
            };
          };
        };
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

const STORE_SUMMARY_QUERY = `
  query StoreSummary($first: Int!) {
    shop {
      name
      currencyCode
    }
    products(first: $first) {
      edges {
        node {
          id
          title
        }
      }
    }
    orders(first: 100, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          createdAt
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export async function GET() {
  try {
    const json = await shopifyAdminGraphQL<RevenueEstimateResponse>(
      STORE_SUMMARY_QUERY,
      { first: 50 }
    );

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    const shop = json.data?.shop;
    const productEdges = json.data?.products?.edges ?? [];
    const orderEdges = json.data?.orders?.edges ?? [];

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const since = now - THIRTY_DAYS_MS;

    const recentOrders = orderEdges
      .map((e) => e.node)
      .filter((order) => {
        const t = new Date(order.createdAt).getTime();
        return Number.isFinite(t) && t >= since;
      });

    const recentRevenue30d = recentOrders.reduce((sum, order) => {
      const amount = Number(order.currentTotalPriceSet?.shopMoney?.amount || 0);
      return sum + amount;
    }, 0);

    const recentOrders30d = recentOrders.length;
    const averageOrderValue30d =
      recentOrders30d > 0 ? recentRevenue30d / recentOrders30d : 0;

    const summary: ShopifyStoreSummary = {
      storeName: shop?.name || "Shopify Store",
      currency: shop?.currencyCode || "USD",
      recentRevenue30d: Math.round(recentRevenue30d * 100) / 100,
      recentOrders30d,
      averageOrderValue30d: Math.round(averageOrderValue30d * 100) / 100,
      productCount: productEdges.length,
      topProducts: productEdges.slice(0, 5).map((e) => ({
        id: e.node.id,
        title: e.node.title,
      })),
    };

    const estimate = estimateRevenueImpact(summary);

    return NextResponse.json({
      ok: true,
      summary,
      estimate,
    });
  } catch (error) {
    console.error("REVENUE_ESTIMATE_ERROR", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate revenue estimate." },
      { status: 500 }
    );
  }
}