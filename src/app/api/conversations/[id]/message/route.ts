// src/app/api/conversations/[id]/message/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedUserAndTenant();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const role =
      typeof body.role === "string" && body.role.trim()
        ? body.role.trim()
        : "staff";

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    const products = Array.isArray(body.products) ? body.products : [];

    if (!content && products.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Message content or product required" },
        { status: 400 }
      );
    }

    const convo = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        tenantId: auth.tenant.id,
      },
      select: {
  id: true,
  aiEnabled: true,
  status: true,
},
    });

    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const finalRole =
      role === "assistant" || role === "customer" || role === "note"
        ? role
        : "staff";

const message = await prisma.message.create({
  data: {
    conversationId: convo.id,
    role: finalRole,
    content,
    productsJson:
      products.length > 0
        ? JSON.stringify(products)
        : null,
  },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

await prisma.conversation.update({
  where: { id: convo.id },
  data: {
    lastMessageAt: new Date(),
    lastSeenAt: new Date(),
    needsHuman: finalRole === "staff" ? false : undefined,

    // Staff is actively handling the conversation.
    // Keep AI paused while staff replies.
    aiEnabled: finalRole === "staff" ? false : undefined,
    status: finalRole === "staff" && convo.status !== "closed" ? "waiting" : undefined,
  },
});

    return NextResponse.json({
      ok: true,
      message: {
        ...message,
        products,
      },
    });
  } catch (error) {
    console.error("POST /api/conversations/[id]/message failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}