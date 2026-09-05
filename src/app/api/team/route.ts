// src/app/api/team/route.ts

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
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      memberships: {
        select: {
  role: true,
  settingsJson: true,
  user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ ok: false, error: "Tenant not found" }, { status: 404 });
  }

  const members = [
    {
      id: tenant.owner.id,
      email: tenant.owner.email,
      name: tenant.owner.name,
      role: "owner",
      settings: {},
    },
    ...tenant.memberships
      .filter((m) => m.user.id !== tenant.owner.id)
      .map((m) => ({
  id: m.user.id,
  email: m.user.email,
  name: m.user.name,
  role: m.role || "staff",
  settings: m.settingsJson ? JSON.parse(m.settingsJson) : {},
})),
  ];

return NextResponse.json({
  ok: true,
  currentUser: {
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
  },
  members,
});
}