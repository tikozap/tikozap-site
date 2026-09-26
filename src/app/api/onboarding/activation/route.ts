// src/app/api/onboarding/activation/route.ts

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

  const [tenant, widget, knowledgeDocs, conversationCount, widgetConversationCount, previewCount] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          starterLinkEnabled: true,
          starterLinkSlug: true,
          createdAt: true,
        },
      }),

      prisma.widget.findUnique({
        where: { tenantId },
        select: {
          id: true,
          installedAt: true,
          enabled: true,
        },
      }),

      prisma.knowledgeDoc.findMany({
        where: { tenantId },
        select: {
          title: true,
          content: true,
        },
      }),

      prisma.conversation.count({
        where: { tenantId },
      }),

      prisma.conversation.count({
        where: {
          tenantId,
          channel: "web",
        },
      }),

      prisma.metricEvent.count({
        where: {
          tenantId,
          event: {
            contains: "preview",
            mode: "insensitive",
          },
        },
      }),
    ]);

  const filledKnowledgeCount = knowledgeDocs.filter((doc) => {
    return doc.content.trim().length > 0;
  }).length;

  const knowledgePct = Math.min(
    100,
    Math.round((filledKnowledgeCount / 5) * 100)
  );

  const steps = [
    {
      id: "install",
      label: "Created store workspace",
      done: Boolean(tenant),
    },
    {
      id: "knowledge",
      label: "Added store knowledge",
      done: knowledgePct === 100,
      conversionPct: knowledgePct,
    },
    {
      id: "starter-link",
      label: "Starter Link ready",
      done: Boolean(tenant?.starterLinkEnabled && tenant?.starterLinkSlug),
    },
    {
      id: "widget",
      label: "Installed website widget",
      done: Boolean(widget?.installedAt || widgetConversationCount > 0),
    },
    {
      id: "first-conversation",
      label: "Handled first conversation",
      done: conversationCount > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  return NextResponse.json({
    ok: true,
    window: windowParam,
    status: {
      completedCount,
      totalCount,
      completionPct,
      isComplete: completedCount === totalCount,
    },
    funnel: {
      startedAt: startedAt.toISOString(),
      totalEvents: completedCount,
      baselineCount: totalCount,
      steps: steps.map((step) => ({
        id: step.id,
        label: step.label,
        count: step.done ? 1 : 0,
        conversionPct:
          "conversionPct" in step ? step.conversionPct : step.done ? 100 : 0,
      })),
    },
    checklist: steps.map((step) => ({
      id: step.id,
      title: step.label,
      done: step.done,
    })),
  });
}