// src/app/api/metrics/support/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";

type WindowKey = "24h" | "7d" | "30d";

function getWindowStart(windowKey: WindowKey) {
  const now = Date.now();

  if (windowKey === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (windowKey === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000);

  return new Date(now - 24 * 60 * 60 * 1000);
}

export async function GET(req: Request) {
  const authed = await getAuthedUserAndTenant();

  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = authed.tenant.id;
  const url = new URL(req.url);
  const windowParam = (url.searchParams.get("window") || "24h") as WindowKey;
  const startedAt = getWindowStart(windowParam);

  const [conversations, rateLimitedEvents] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startedAt,
        },
      },
      select: {
        id: true,
        status: true,
        needsHuman: true,
        aiEnabled: true,
        tags: true,
      },
    }),

    prisma.metricEvent.count({
      where: {
        tenantId,
        createdAt: {
          gte: startedAt,
        },
        event: {
          contains: "rate",
          mode: "insensitive",
        },
      },
    }),
  ]);

  const needsHumanFallback = conversations.filter((c) => c.needsHuman).length;

  const answered = conversations.filter((c) => {
    const status = (c.status || "").toLowerCase();
    return status === "closed" || status === "resolved";
  }).length;

const openNow = conversations.filter(
  (c) => (c.status || "").toLowerCase() === "open"
).length;

const waitingHuman = conversations.filter(
  (c) => (c.status || "").toLowerCase() === "waiting"
).length;

const aiPaused = conversations.filter((c) => !c.aiEnabled).length;

const intents: Record<string, number> = {
  open_now: openNow,
  waiting_human: waitingHuman,
  ai_resolved: answered,
  ai_paused: aiPaused,
};

  return NextResponse.json({
    ok: true,
    window: windowParam,
    metrics: {
      startedAt: startedAt.toISOString(),
      totalEvents: conversations.length,
counters: {
  answered,
  needsHumanFallback,
  rateLimited: rateLimitedEvents,

  openNow,
  waitingHuman,
  aiPaused,

  intents,
},
    },
  });
}