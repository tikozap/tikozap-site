// src/app/api/conversations/[id]/seen/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
import { markDemoInboxSeen } from "@/lib/demoInboxStore";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  markDemoInboxSeen(params.id);

  return NextResponse.json({ ok: true });
}