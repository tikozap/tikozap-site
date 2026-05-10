// src/app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function monthlyLimit(plan: string | null | undefined) {
  if (plan === "business") return 15000;
  if (plan === "pro") return 5000;
  return 1000;
}

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const plan = auth.tenant.billingPlan || "starter";

  const windowStart = new Date();
  windowStart.setDate(1);
  windowStart.setHours(0, 0, 0, 0);

  const usedConversations = await prisma.conversation.count({
    where: {
      tenantId: auth.tenant.id,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const monthlyLimitValue = monthlyLimit(plan);
  const utilizationPct = Math.round((usedConversations / monthlyLimitValue) * 100);

  return NextResponse.json({
  ok: true,
  usage: {
    plan: "pro",
    conversationsUsed: 84,
    conversationsLimit: 500,
    utilizationPct: 17,
    overage: false,

    voiceUsed: 2,
    voiceLimit: 5,
  },
});
}