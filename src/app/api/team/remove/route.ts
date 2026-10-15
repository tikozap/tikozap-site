// src/app/api/team/remove/route.ts

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
  const userId = String(body?.userId || "").trim();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "User ID required" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenant.id },
    select: { ownerId: true },
  });

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "Tenant not found" },
      { status: 404 }
    );
  }

  if (tenant.ownerId === userId) {
    return NextResponse.json(
      { ok: false, error: "Owner cannot be removed" },
      { status: 400 }
    );
  }

  await prisma.membership.deleteMany({
    where: {
      tenantId: auth.tenant.id,
      userId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}