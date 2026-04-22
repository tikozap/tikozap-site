// src/app/api/conversations/[id]/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
import { getDemoInboxConversation } from "@/lib/demoInboxStore";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const conversation = getDemoInboxConversation(params.id);

  if (!conversation) {
    return NextResponse.json(
      { ok: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    conversation,
  });
}