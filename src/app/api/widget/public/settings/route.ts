// src/app/api/widget/public/settings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantVoiceUsage } from "@/lib/voiceUsage";

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
      { status: 400, headers: { ...corsHeaders, "cache-control": "no-store" } }
    );
  }

  const widget = await prisma.widget.findUnique({
    where: { publicKey: key },
    select: {
      enabled: true,
      brandColor: true,
      assistantName: true,
      greeting: true,
      tenantId: true,
    },
  });

  if (!widget || !widget.enabled) {
    return NextResponse.json(
      { ok: false, error: "Widget not found or disabled" },
      { status: 404, headers: { ...corsHeaders, "cache-control": "no-store" } }
    );
  }

  const voice = await getTenantVoiceUsage(widget.tenantId);

  return NextResponse.json(
    {
      ok: true,
      widget: {
        enabled: widget.enabled,
        brandColor: widget.brandColor || "#111827",
        assistantName: widget.assistantName || "Store Assistant",
        greeting:
          widget.greeting ||
          "Hi! I can help you find products, orders, and more.",
        voice,
      },
    },
    { headers: { ...corsHeaders, "cache-control": "no-store" } }
  );
}