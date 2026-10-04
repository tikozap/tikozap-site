// src/app/api/auth/me/route.ts

import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: { id: userId },
    tenant: null,
  });
}