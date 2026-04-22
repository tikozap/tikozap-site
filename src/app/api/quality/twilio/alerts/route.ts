import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";

export const runtime = "nodejs";

type WindowKey = "24h" | "7d" | "30d";

export async function GET(req: Request) {
  const auth = await getDemoSession();

  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const windowParam = (url.searchParams.get("window") || "24h") as WindowKey;

  return NextResponse.json({
    ok: true,
    window: windowParam,
    thresholds: {
      mosWarning: 3.5,
      mosCritical: 3.0,
      jitterMsMax: 30,
      packetLossPctMax: 2,
      roundTripMsMax: 250,
    },
    alerts: [
      {
        id: "twilio-alert-1",
        severity: "warning",
        message: "One recent call showed elevated jitter.",
        metric: "jitterMs",
        value: 34,
        threshold: 30,
      },
    ],
  });
}