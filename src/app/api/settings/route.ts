// src/app/api/settings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

function safeWebUrl(value: unknown) {
  const raw = String(value || "").trim();

  if (!raw) return null;

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

function safeAssistantImage(value: unknown) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  if (
    /^data:image\/(?:jpeg|png|webp);base64,/i.test(raw)
  ) {
    if (raw.length > 3_000_000) {
      return null;
    }

    return raw;
  }

  try {
    const url = new URL(raw);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      storeName: true,
      websiteUrl: true,
      settingsJson: true,

      owner: {
        select: {
          name: true,
        },
      },
    },
  });

  let settings: any = {};

  try {
    settings = tenant?.settingsJson
      ? JSON.parse(tenant.settingsJson)
      : {};
  } catch {
    settings = {};
  }

  return NextResponse.json({
    ok: true,
    profile: {
      ownerName: tenant?.owner?.name || "",
      storeName: tenant?.storeName || "",
      websiteUrl: tenant?.websiteUrl || "",
      supportEmail: settings.supportEmail || "",
      category: settings.category || "Fashion",
      timeZone: settings.timeZone || "America/New_York",
      businessHours:
        settings.businessHours || "Mon–Fri, 9 AM–5 PM",
    },
    settings,
  });
}

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid request origin.',
      },
      {
        status: 403,
      }
    );
  }
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (auth.tenant.role !== 'owner') {
  return NextResponse.json(
    {
      ok: false,
      error: 'Owner access required.',
    },
    {
      status: 403,
    }
  );
}

  const body = await req.json().catch(() => ({}));

  const settings =
    body?.settings && typeof body.settings === "object"
      ? body.settings
      : {};

      if (
  Object.prototype.hasOwnProperty.call(
    settings,
    "tz_assistant_icon_data_url"
  )
) {
  const safeIcon = safeAssistantImage(
    settings.tz_assistant_icon_data_url
  );

  if (safeIcon === null) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Assistant image must be JPG, PNG, or WebP and smaller than 2 MB.",
      },
      { status: 400 }
    );
  }

  settings.tz_assistant_icon_data_url = safeIcon;
}

  const profile =
    body?.profile && typeof body.profile === "object"
      ? body.profile
      : null;

  const current = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      storeName: true,
      settingsJson: true,

      owner: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json(
      { ok: false, error: "Store not found." },
      { status: 404 }
    );
  }

  let currentSettings: any = {};

  try {
    currentSettings = current.settingsJson
      ? JSON.parse(current.settingsJson)
      : {};
  } catch {
    currentSettings = {};
  }

  const nextSettings: any = {
    ...currentSettings,
    ...settings,
  };

  if (profile) {
    nextSettings.supportEmail = String(
      profile.supportEmail || ""
    ).trim();

    nextSettings.category = String(
      profile.category || "Fashion"
    ).trim();

    nextSettings.timeZone = String(
      profile.timeZone || "America/New_York"
    ).trim();

    nextSettings.businessHours = String(
      profile.businessHours || ""
    ).trim();

    await prisma.tenant.update({
      where: { id: auth.tenant.id },
      data: {
        storeName:
          String(profile.storeName || "").trim() ||
          current.storeName ||
          "Your Store",

websiteUrl: safeWebUrl(profile.websiteUrl),

        settingsJson: JSON.stringify(nextSettings),
      },
    });

    await prisma.user.update({
      where: {
        id: current.owner.id,
      },
      data: {
        name:
          String(profile.ownerName || "").trim() || null,
      },
    });
  } else {
    await prisma.tenant.update({
      where: { id: auth.tenant.id },
      data: {
        settingsJson: JSON.stringify(nextSettings),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    settings: nextSettings,
  });
}