import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const Query = z.object({
  key: z.string().min(8).max(200),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = Query.safeParse({ key: searchParams.get("key") || "" });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid key" },
      { status: 400, headers: corsHeaders }
    );
  }

  const publicKey = parsed.data.key;

  // Assumes publicKey is unique. If your schema differs, tell me and I’ll adjust.
  const widget = await prisma.widget.findUnique({
    where: { publicKey },
    select: {
      tenantId: true,
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

  // You can add cache if you want:
  // - short TTL is good (e.g., 60s) because owners may change settings
  return NextResponse.json({ ok: true, widget }, { headers: corsHeaders });
}
