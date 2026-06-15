// src/app/api/conversations/[id]/tags/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoSession } from "@/lib/demoAuth";
import { getDemoInboxConversation } from "@/lib/demoInboxStore";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const clean = tags
      .map((t: any) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);

    const demoAuth = await getDemoSession();
    const demoConvo = getDemoInboxConversation(params.id);

    if (demoAuth && demoConvo) {
      demoConvo.tags = clean;

      return NextResponse.json({
        ok: true,
        conversation: demoConvo,
      });
    }

    const auth = await getAuthedUserAndTenant();

    if (!auth?.tenant?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenant.id,
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

    const updated = await prisma.conversation.update({
      where: {
        id: conversation.id,
      },
data: {
  tags: clean.join(","),
},
    });

    return NextResponse.json({
      ok: true,
      conversation: updated,
    });
  } catch (error) {
    console.error("POST /api/conversations/[id]/tags failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}