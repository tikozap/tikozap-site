// src/app/api/widget/public/thread/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Query = z.object({
  key: z.string().min(8).max(200),
  conversationId: z.string().min(8).max(200),
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

const ALWAYS_ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "app.tikozap.com",
  "link.tikozap.com",
  "tikozap.com",
]);

function normalizeHost(h: string) {
  const s = String(h || "").trim().toLowerCase();
  if (!s) return "";
  return s.startsWith("www.") ? s.slice(4) : s;
}

function hostFromUrlHeader(v: string | null) {
  if (!v) return "";
  try {
    const u = new URL(v);
    return normalizeHost(u.hostname);
  } catch {
    return "";
  }
}

function getOriginHost(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  return hostFromUrlHeader(origin) || hostFromUrlHeader(referer) || "";
}

function isHostAllowed(host: string, allowedDomains: string[]) {
  const h = normalizeHost(host);
  if (!h) return false;

  if (ALWAYS_ALLOWED_HOSTS.has(h)) return true;

  for (const raw of allowedDomains || []) {
    const rule = String(raw || "").trim().toLowerCase();
    if (!rule) continue;

    if (rule.startsWith("*.")) {
      const suffix = rule.slice(1); // ".example.com"
      if (h.endsWith(suffix)) return true;
      continue;
    }

    const r = normalizeHost(rule);
    if (h === r) return true;
  }

  return false;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
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

    // IMPORTANT: avoid top-level prisma import for consistency
    const { prisma } = await import("@/lib/prisma");

    const widget = await prisma.widget.findUnique({
      where: { publicKey: key },
      select: { enabled: true, tenantId: true, allowedDomains: true },
    });

    if (!widget || widget.enabled === false) {
      return NextResponse.json(
        { ok: false, error: "Widget not found or disabled" },
        { status: 404, headers: { ...corsHeaders, "cache-control": "no-store" } }
      );
    }

    // ✅ Milestone 7: Allowed-domain enforcement (thread)
    const allowed = Array.isArray(widget.allowedDomains) ? widget.allowedDomains : [];
    if (allowed.length > 0) {
      const originHost = getOriginHost(req);

      if (!originHost) {
        return NextResponse.json(
          { ok: false, error: "Origin not allowed (missing Origin/Referer)" },
          { status: 403, headers: { ...corsHeaders, "cache-control": "no-store" } }
        );
      }

      if (!isHostAllowed(originHost, allowed)) {
        return NextResponse.json(
          { ok: false, error: `Origin not allowed: ${originHost}` },
          { status: 403, headers: { ...corsHeaders, "cache-control": "no-store" } }
        );
      }
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

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conv.id,
        role: { in: ["customer", "assistant", "staff"] },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, conversationId: conv.id, messages },
      { headers: { ...corsHeaders, "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500, headers: { ...corsHeaders, "cache-control": "no-store" } }
    );
  }
}
