// src/app/api/voice/config/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantVoiceUsage } from "@/lib/voiceUsage";

export const runtime = "nodejs";

const VOICE_PACKS: Record<
  string,
  {
    label: string;
    minutes: number;
  }
> = {
  starter: {
    label: "Voice Starter",
    minutes: 100,
  },
  pro: {
    label: "Voice Pro",
    minutes: 500,
  },
  business: {
    label: "Voice Business",
    minutes: 2000,
  },
};

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").trim();

  if (action === "disable") {
    await prisma.tenant.update({
      where: { id: auth.tenant.id },
      data: {
        voiceEnabled: false,
        voicePack: null,
        voiceMinutesLimit: 0,
      },
    });

    const voice = await getTenantVoiceUsage(auth.tenant.id);

    return NextResponse.json({
      ok: true,
      voice,
    });
  }

  if (action === "enable") {
    const pack = String(body.pack || "").trim().toLowerCase();
    const selected = VOICE_PACKS[pack];

    if (!selected) {
      return NextResponse.json(
        { ok: false, error: "Invalid voice pack." },
        { status: 400 }
      );
    }

    await prisma.tenant.update({
      where: { id: auth.tenant.id },
      data: {
        voiceEnabled: true,
        voicePack: selected.label,
        voiceMinutesLimit: selected.minutes,
        voiceMinutesUsed: 0,
        voiceUsagePeriodStart: new Date(),
      },
    });

    const voice = await getTenantVoiceUsage(auth.tenant.id);

    return NextResponse.json({
      ok: true,
      voice,
    });
  }

  return NextResponse.json(
    { ok: false, error: "Invalid action." },
    { status: 400 }
  );
}