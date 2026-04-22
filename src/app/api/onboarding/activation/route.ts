// src/app/api/onboarding/activation/route.ts

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
    status: {
      completedCount: 4,
      totalCount: 5,
      completionPct: 80,
      isComplete: false,
    },
    funnel: {
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalEvents: 42,
      baselineCount: 10,
      steps: [
        {
          id: "install",
          label: "Installed app",
          count: 10,
          conversionPct: 100,
        },
        {
          id: "knowledge",
          label: "Added store knowledge",
          count: 8,
          conversionPct: 80,
        },
        {
          id: "preview",
          label: "Previewed assistant",
          count: 7,
          conversionPct: 70,
        },
        {
          id: "widget",
          label: "Installed widget",
          count: 5,
          conversionPct: 50,
        },
        {
          id: "first-conversation",
          label: "Handled first conversation",
          count: 4,
          conversionPct: 40,
        },
      ],
    },
    checklist: [
      {
        id: "check-1",
        title: "Widget installed",
        done: true,
      },
      {
        id: "check-2",
        title: "Knowledge added",
        done: true,
      },
      {
        id: "check-3",
        title: "Starter Link configured",
        done: true,
      },
      {
        id: "check-4",
        title: "Inbox reviewed",
        done: true,
      },
      {
        id: "check-5",
        title: "First live conversation handled",
        done: false,
      },
    ],
  });
}