// src/app/api/widget/public/settings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantVoiceUsage } from "@/lib/voiceUsage";

export const runtime = "nodejs";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Missing key" },
      { status: 400, headers: { ...corsHeaders, "cache-control": "no-store" } }
    );
  }

const widget = await prisma.widget.findUnique({
  where: { publicKey: key },
  select: {
    enabled: true,
    brandColor: true,
    assistantName: true,
    assistantIdentity: true,
    greeting: true,
    tenantId: true,
    tenant: {
      select: {
        settingsJson: true,
      },
    },
  },
});

  if (!widget || !widget.enabled) {
    return NextResponse.json(
      { ok: false, error: "Widget not found or disabled" },
      { status: 404, headers: { ...corsHeaders, "cache-control": "no-store" } }
    );
  }

  const voice = await getTenantVoiceUsage(widget.tenantId);

let settings: Record<string, string> = {};

try {
  settings = widget.tenant?.settingsJson
    ? JSON.parse(widget.tenant.settingsJson)
    : {};
} catch {
  settings = {};
}

  return NextResponse.json(
    {
      ok: true,
      widget: {
        enabled: widget.enabled,

        brandColor:
          settings.tz_brand_color?.trim() ||
          widget.brandColor ||
          "#111827",

        assistantName:
          settings.tz_assistant_name?.trim() ||
          widget.assistantName ||
          "Store Assistant",

        assistantIdentity:
          settings.tz_assistant_identity?.trim() ||
          widget.assistantIdentity ||
          "Female",

        assistantAvatarUrl:
          settings.tz_assistant_icon_data_url?.trim() || "",

        launcherAppearance:
          settings.tz_launcher_appearance === "avatar" ||
          settings.tz_launcher_appearance === "bubble"
            ? settings.tz_launcher_appearance
            : "orb",

        chatAppearance:
          settings.tz_chat_appearance === "avatar"
            ? "avatar"
            : "orb",

        voiceAppearance:
          settings.tz_voice_appearance === "avatar"
            ? "avatar"
            : "orb",

        greeting:
          settings.tz_assistant_greeting?.trim() ||
          widget.greeting ||
          "Hi! I can help you find products, orders, and more.",

voice: {
  enabled: voice.enabled,
},
      },
    },
    {
      headers: {
        ...corsHeaders,
        "cache-control": "no-store",
      },
    }
  );
}
