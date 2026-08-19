// src/app/api/demo/revenue-estimate/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    summary: {
      storeName: "Demo Store",
    },
    estimate: {
      baselineRevenue: 12000,
      conservativeGain: 600,
      strongGain: 1800,
      expectedGain: 1200,
    },
  });
}