// src/app/api/conversations/[id]/message/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
import {
  appendDemoInboxMessage,
  getDemoInboxConversation,
} from "@/lib/demoInboxStore";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getDemoSession();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const convo = getDemoInboxConversation(params.id);
    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
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

    const message = appendDemoInboxMessage(
      convo.id,
      role === "assistant" || role === "customer" ? role : "staff",
      content,
      products
    );

    return NextResponse.json({
      ok: true,
      message,
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