// src/app/api/voice/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  enabled: z.boolean().optional(),
  greeting: z.string().optional(),
  fallbackLine: z.string().optional(),
  afterHoursLine: z.string().optional(),
  businessHoursJson: z.string().optional(),
});

function getCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") || "";
  const parts = raw.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

async function requireTenantId(req: Request) {
  const tenantId = getCookie(req, "tz_tenant");
  if (!tenantId) throw new Error("Missing tz_tenant cookie");
  return tenantId;
}

function requireAppBaseUrl(req: Request) {
  const env = (process.env.APP_BASE_URL || "").trim();
  if (env) return env;

  // fallback: reconstruct from request headers (Vercel-safe)
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "app.tikozap.com";
  return `${proto}://${host}`;
}

function normalizeText(v: unknown): string | null {
  const t = (v ?? "").toString().trim();
  return t.length ? t : null;
}

function validateJsonOrThrow(raw: string | null) {
  if (!raw) return;
  JSON.parse(raw); // throws if invalid
}

export async function GET(req: Request) {
  try {
    const tenantId = await requireTenantId(req);

    // get tenant timezone for defaults
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, timeZone: true },
    });
    if (!tenant) throw new Error("Unknown tenant");

    // Ensure row exists so Prisma Studio + UI always see the latest schema fields
    const settings = await prisma.phoneAgentSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enabled: false,
        timeZone: tenant.timeZone || "America/New_York",
      },
      update: {},
    });

    return NextResponse.json(
      {
        ok: true,
        tenantId,
        appBaseUrl: requireAppBaseUrl(req),
        settings,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[voice/settings][GET]", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load settings" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await requireTenantId(req);
    const body = Body.parse(await req.json());

    // Normalize empty strings → null
    const greeting = normalizeText(body.greeting);
    const fallbackLine = normalizeText(body.fallbackLine);
    const afterHoursLine = normalizeText(body.afterHoursLine);
    const businessHoursJson = normalizeText(body.businessHoursJson);

    // Validate JSON if provided
    try {
      validateJsonOrThrow(businessHoursJson);
    } catch (err: any) {
      return NextResponse.json(
        { ok: false, error: err?.message || "Invalid businessHoursJson JSON" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // ensure row exists then update
    await prisma.phoneAgentSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enabled: body.enabled ?? false,
        greeting,
        fallbackLine,
        afterHoursLine,
        businessHoursJson,
      },
      update: {
        enabled: body.enabled ?? undefined,
        greeting,
        fallbackLine,
        afterHoursLine,
        businessHoursJson,
      },
    });

    const settings = await prisma.phoneAgentSettings.findUnique({
      where: { tenantId },
    });

    return NextResponse.json(
      { ok: true, tenantId, appBaseUrl: requireAppBaseUrl(req), settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[voice/settings][POST]", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to save settings" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
