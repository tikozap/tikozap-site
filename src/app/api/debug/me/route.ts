// src/app/api/debug/me/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  return NextResponse.json({
    ok: true,
    tenant: auth?.tenant || null,
    user: auth?.user || null,
  });
}