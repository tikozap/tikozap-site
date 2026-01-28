// src/app/api/widget/public/settings/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Query = z.object({ key: z.string().min(8).max(200) });

const corsHeaders = {
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
  const { searchParams } = new URL(req.url);
  const parsed = Query.safeParse({ key: searchParams.get("key") ?? "" });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid key" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // IMPORTANT: keep prisma import inside handler
    const { prisma } = await import("@/lib/prisma");

    const widget = await prisma.widget.findUnique({
      where: { publicKey: parsed.data.key },
      // NOTE: include allowedDomains for enforcement, but do NOT return it
      select: {
        publicKey: true,
        installedAt: true,
        enabled: true,
        assistantName: true,
        greeting: true,
        brandColor: true,
        allowedDomains: true,
      },
    });

    if (!widget || widget.enabled === false) {
      return NextResponse.json(
        { ok: false, error: "Widget not found or disabled" },
        { status: 404, headers: corsHeaders }
      );
    }

    // ✅ Milestone 7: Allowed-domain enforcement (settings)
    const allowed = Array.isArray(widget.allowedDomains) ? widget.allowedDomains : [];
    if (allowed.length > 0) {
      const originHost = getOriginHost(req);

      if (!originHost) {
        return NextResponse.json(
          { ok: false, error: "Origin not allowed (missing Origin/Referer)" },
          { status: 403, headers: corsHeaders }
        );
      }

      if (!isHostAllowed(originHost, allowed)) {
        return NextResponse.json(
          { ok: false, error: `Origin not allowed: ${originHost}` },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Do NOT leak allowedDomains publicly
    const { allowedDomains: _omit, ...publicWidget } = widget;

    return NextResponse.json(
      { ok: true, widget: publicWidget },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
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
