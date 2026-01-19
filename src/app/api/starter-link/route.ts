// src/app/api/starter-link/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Starter Link API temporarily disabled (deploy unblock)" },
    { status: 501, headers: corsHeaders }
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Starter Link API temporarily disabled (deploy unblock)" },
    { status: 501, headers: corsHeaders }
  );
}
