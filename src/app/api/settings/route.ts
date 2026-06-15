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
    select: { settingsJson: true },
  });

  let settings = {};

  try {
    settings = tenant?.settingsJson ? JSON.parse(tenant.settingsJson) : {};
  } catch {
    settings = {};
  }

  return NextResponse.json({
    ok: true,
    settings,
  });
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const settings = body?.settings && typeof body.settings === "object"
    ? body.settings
    : {};

  await prisma.tenant.update({
    where: { id: auth.tenant.id },
    data: {
      settingsJson: JSON.stringify(settings),
    },
  });

  return NextResponse.json({
    ok: true,
    settings,
  });
}