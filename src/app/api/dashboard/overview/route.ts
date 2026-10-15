// src/app/api/dashboard/overview/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function normalizeChannel(channel: string | null | undefined) {
  const c = (channel || "web").toLowerCase();

  if (c.includes("starter") || c.includes("link")) return "Starter Link";
  if (c.includes("phone") || c.includes("voice")) return "Phone";
  if (c.includes("email")) return "Email";
  return "Web";
}

export async function GET() {
  const authed = await getAuthedUserAndTenant();

  if (!authed?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = authed.tenant.id;
  const now = new Date();

  const start = new Date(now.getTime() - 6 * DAY_MS);
  start.setHours(0, 0, 0, 0);

  const conversations = await prisma.conversation.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: start,
      },
    },
    select: {
      id: true,
      channel: true,
      createdAt: true,
      status: true,
      needsHuman: true,
      aiEnabled: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start.getTime() + i * DAY_MS);
    return {
      day: dayLabel(d),
      chats: 0,
    };
  });

  for (const c of conversations) {
    const index = Math.floor((c.createdAt.getTime() - start.getTime()) / DAY_MS);
    if (index >= 0 && index < trend.length) {
      trend[index].chats += 1;
    }
  }

  const channelMap: Record<string, number> = {
    Web: 0,
    "Starter Link": 0,
    Email: 0,
    Phone: 0,
  };

  for (const c of conversations) {
    const label = normalizeChannel(c.channel);
    channelMap[label] = (channelMap[label] || 0) + 1;
  }

  const channels = Object.entries(channelMap).map(([name, value]) => ({
    name,
    value,
  }));

  return NextResponse.json({
    ok: true,
    window: "7d",
    overview: {
      trend,
      channels,
      totals: {
        conversations: conversations.length,
        needsHuman: conversations.filter((c) => c.needsHuman).length,
        open: conversations.filter((c) => c.status === "open").length,
        aiPaused: conversations.filter((c) => !c.aiEnabled).length,
      },
    },
  });
}