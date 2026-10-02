// src/app/api/team/member-settings/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = "nodejs";

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
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
  const userId = String(body?.userId || "").trim();
  const settings = body?.settings && typeof body.settings === "object"
    ? body.settings
    : {};

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "User ID required" },
      { status: 400 }
    );
  }

  const membership = await prisma.membership.findFirst({
    where: {
      tenantId: auth.tenant.id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    return NextResponse.json(
      { ok: false, error: "Team member not found" },
      { status: 404 }
    );
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      settingsJson: JSON.stringify(settings),
    },
  });

  return NextResponse.json({
    ok: true,
    settings,
  });
}