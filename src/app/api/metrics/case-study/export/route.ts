// src/app/api/metrics/case-study/export/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getDemoSession();

  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const windowParam = url.searchParams.get("window") || "30d";

  return NextResponse.json({
    ok: true,
    window: windowParam,
    rows: [
      {
        date: "2026-03-01",
        conversations: 18,
        autoResolved: 13,
        needsHuman: 5,
      },
      {
        date: "2026-03-08",
        conversations: 22,
        autoResolved: 16,
        needsHuman: 6,
      },
      {
        date: "2026-03-15",
        conversations: 19,
        autoResolved: 14,
        needsHuman: 5,
      },
      {
        date: "2026-03-22",
        conversations: 25,
        autoResolved: 18,
        needsHuman: 7,
      },
    ],
    summary: {
      conversations: 84,
      autoResolved: 61,
      needsHuman: 23,
    },
  });
}