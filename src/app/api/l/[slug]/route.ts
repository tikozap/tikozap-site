// src/app/api/l/[slug]/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  // TEMP: this endpoint is not enabled yet (was referencing prisma.channel which doesn't exist)
  return NextResponse.json(
    { ok: false, error: "Starter link not enabled yet", slug: params.slug },
    { status: 404 }
  );
}
