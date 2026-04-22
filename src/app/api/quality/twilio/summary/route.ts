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
    summary: {
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      totalEvents: 18,
      withQualityMetrics: 14,
      latest: {
        createdAt: new Date().toISOString(),
        eventType: "voice_quality_summary",
        callSid: "CA_demo_123",
        verification: "demo",
      },
      averages: {
        mos: 4.1,
        jitterMs: 18.4,
        packetLossPct: 0.6,
        roundTripMs: 142,
      },
      degraded: {
        lowMos: 1,
        highJitter: 2,
        highPacketLoss: 0,
        highRoundTrip: 1,
      },
      health: {
        score: 89,
        grade: "A",
        reasons: ["Stable MOS", "Low packet loss", "Acceptable round-trip latency"],
      },
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
    },
  });
}