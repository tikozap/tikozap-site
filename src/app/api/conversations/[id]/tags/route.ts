// src/app/api/conversations/[id]/tags/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
import { getDemoInboxConversation } from "@/lib/demoInboxStore";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getDemoSession();
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const clean = tags
      .map((t: any) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);

    const convo = getDemoInboxConversation(params.id);
    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    convo.tags = clean;

    return NextResponse.json({
      ok: true,
      conversation: convo,
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