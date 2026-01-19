import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Starter Link QR is not enabled yet" },
    { status: 404 }
  );
}
