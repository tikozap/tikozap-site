// "src/app/api/admin/tenants/[id]/archive/route.ts"

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  await prisma.tenant.update({
    where: { id },
    data: {
      isDeleted: true,
      archivedAt: new Date(),
      starterLinkEnabled: false,
    },
  });

  return NextResponse.redirect(new URL("/admin/tenants", _req.url));
}