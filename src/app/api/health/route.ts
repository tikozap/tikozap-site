// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Optional: ensure it’s never statically optimized/cached by Next
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    // IMPORTANT: avoid top-level prisma import in serverless edge-ish contexts
    const { prisma } = await import("@/lib/prisma");

    // Cheapest DB roundtrip:
    // Postgres: returns something like [{ "?column?": 1 }]
    await prisma.$queryRaw`SELECT 1`;

    const latencyMs = Date.now() - started;
    const commit =
      (process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
        "local").slice(0, 7);

    return NextResponse.json(
      { ok: true, db: true, latencyMs, commit },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (err: any) {
    const latencyMs = Date.now() - started;
    return NextResponse.json(
      {
        ok: false,
        db: false,
        latencyMs,
        error: err?.code || "HealthCheckError",
        message: err?.message || String(err),
      },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
