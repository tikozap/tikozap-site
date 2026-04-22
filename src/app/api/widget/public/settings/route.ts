// src/app/api/widget/public/settings/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Missing key" },
      {
        status: 400,
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      widget: {
        enabled: true,
        brandColor: "#111827",
        assistantName: "Store Assistant",
        greeting: "Hi! I can help you find products, orders, and more.",
      },
    },
    {
      headers: { ...corsHeaders, "cache-control": "no-store" },
    }
  );
}