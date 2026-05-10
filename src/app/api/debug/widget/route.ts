// src/app/api/debug/widget/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") || "";

  const db = await prisma.$queryRawUnsafe<any[]>(
    "select current_database() as db, current_schema() as schema"
  );

  const widget = await prisma.widget.findFirst({
    where: { publicKey: key },
    select: {
      id: true,
      publicKey: true,
      tenantId: true,
      assistantName: true,
      enabled: true,
    },
  });

  return NextResponse.json({
    db,
    key,
    widget,
  });
}