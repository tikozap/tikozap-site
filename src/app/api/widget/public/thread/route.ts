// src/app/api/widget/public/thread/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const Query = z.object({
  key: z.string().min(8).max(200),
  conversationId: z.string().min(8).max(200),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  // IMPORTANT: widget polling sends 'cache-control', so allow it
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = Query.safeParse({
      key: searchParams.get("key") || "",
      conversationId: searchParams.get("conversationId") || "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400, headers: { ...corsHeaders, "cache-control": "no-store" } }
      );
    }

    const { key, conversationId } = parsed.data;

    const widget = await prisma.widget.findUnique({
      where: { publicKey: key },
      select: { enabled: true, tenantId: true },
    });

    if (!widget || widget.enabled === false) {
      return NextResponse.json(
        { ok: false, error: "Widget not found or disabled" },
        { status: 404, headers: { ...corsHeaders, "cache-control": "no-store" } }
      );
    }

    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: widget.tenantId },
      select: { id: true },
    });

    if (!conv) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404, headers: { ...corsHeaders, "cache-control": "no-store" } }
      );
    }

    // Return ONLY public-vis
