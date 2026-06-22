// src/app/api/settings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      storeName: true,
      websiteUrl: true,
      settingsJson: true,
    },
  });

  let settings: any = {};

  try {
    settings = tenant?.settingsJson ? JSON.parse(tenant.settingsJson) : {};
  } catch {
    settings = {};
  }

  return NextResponse.json({
    ok: true,
    profile: {
      storeName: tenant?.storeName || "",
      websiteUrl: tenant?.websiteUrl || "",
      supportEmail: settings.supportEmail || "",
      category: settings.category || "Fashion",
      timeZone: settings.timeZone || "America/New_York",
      businessHours: settings.businessHours || "Mon–Fri, 9 AM–5 PM",
    },
    settings,
  });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const settings =
    body?.settings && typeof body.settings === "object"
      ? body.settings
      : {};

  const profile =
    body?.profile && typeof body.profile === "object"
      ? body.profile
      : null;

  const current = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: {
      storeName: true,
      settingsJson: true,
    },
  });

  let currentSettings: any = {};

  try {
    currentSettings = current?.settingsJson
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
    nextSettings.supportEmail = String(profile.supportEmail || "").trim();
    nextSettings.category = String(profile.category || "Fashion").trim();
    nextSettings.timeZone = String(profile.timeZone || "America/New_York").trim();
    nextSettings.businessHours = String(profile.businessHours || "").trim();

    await prisma.tenant.update({
      where: { id: auth.tenant.id },
      data: {
        storeName:
          String(profile.storeName || "").trim() ||
          current?.storeName ||
          "Your Store",
        websiteUrl: String(profile.websiteUrl || "").trim() || null,
        settingsJson: JSON.stringify(nextSettings),
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