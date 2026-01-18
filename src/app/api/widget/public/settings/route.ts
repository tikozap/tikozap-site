// src/app/api/widget/public/settings/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Query = z.object({ key: z.string().min(8).max(200) });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = Query.safeParse({ key: searchParams.get("key") ?? "" });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid key" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // IMPORTANT: prisma import MUST NOT be at top-level for this route
    const { prisma } = await import("@/lib/prisma");

    const widget = await prisma.widget.findUnique({
      where: { publicKey: parsed.data.key },
      // ✅ do NOT leak tenantId publicly
      select: {
        publicKey: true,
        installedAt: true,
        enabled: true,
        assistantName: true,
        greeting: true,
        brandColor: true,
      },
    });

    if (!widget || widget.enabled === false) {
      return NextResponse.json(
        { ok: false, error: "Widget not found or disabled" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { ok: true, widget },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    console.error("[public/settings] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.code || "InternalError",
        message: err?.message || String(err),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
