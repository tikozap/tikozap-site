// src/app/api/metrics/support/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";

export const runtime = "nodejs";

type WindowKey = "24h" | "7d" | "30d";

export async function GET(req: Request) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const windowParam = (url.searchParams.get("window") || "24h") as WindowKey;

  return NextResponse.json({
    ok: true,
    window: windowParam,
    metrics: {
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      totalEvents: 84,
      counters: {
        answered: 61,
        needsHumanFallback: 23,
        rateLimited: 2,
        intents: {
          order_status: 18,
          returns: 14,
          product_search: 22,
          shipping: 11,
          unknown: 5,
        },
      },
    },
  });
}