// src/app/api/thread/[id]/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(
    { ok: false, error: "Thread API not enabled yet", id: params.id },
    { status: 404, headers: corsHeaders }
  );
}