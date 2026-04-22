// src/app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    usage: {
      plan: "pro",
      conversationsUsed: 84,
      conversationsLimit: 500,
      utilizationPct: 17,
      overage: false,
    },
  });
}