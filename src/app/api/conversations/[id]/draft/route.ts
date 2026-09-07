// src/app/api/conversations/[id]/draft/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { runTikoBrain } from "@/lib/brain";
import {
  getTenantEntitlement,
  TRIAL_PAUSED_MERCHANT_MESSAGE,
} from "@/lib/tenantEntitlement";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: Params) {
  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}
  try {
    const authed = await getAuthedUserAndTenant();

    if (!authed?.tenant?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

const entitlement = await getTenantEntitlement(
  authed.tenant.id
);

if (!entitlement.ok) {
  return NextResponse.json(
    {
      ok: false,
      reason: "TRIAL_EXPIRED",
      error: TRIAL_PAUSED_MERCHANT_MESSAGE,
    },
    { status: 402 }
  );
}

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: authed.tenant.id,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const recentMessages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        role: {
          in: ["customer", "assistant", "staff"],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 16,
      select: {
        role: true,
        content: true,
      },
    });

    const lastCustomer = [...recentMessages]
      .reverse()
      .find((m) => m.role === "customer");

    const message = lastCustomer?.content?.trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "No customer message found" },
        { status: 400 }
      );
    }

    const brain = await runTikoBrain({
      message,
      history: recentMessages.map((m) => ({
        role: m.role as any,
        content: m.content,
      })),
    });

    return NextResponse.json({
      ok: true,
      draft: brain.reply,
      products: brain.products || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "production") {
  console.error("CONVERSATION_DRAFT_FATAL");
} else {
  console.error("CONVERSATION_DRAFT_FATAL", error);
}

    return NextResponse.json(
      {
        ok: false,
        error: "Could not generate draft",
      },
      { status: 500 }
    );
  }
}