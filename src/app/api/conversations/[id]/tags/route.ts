// src/app/api/conversations/[id]/tags/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  try {
    const body = await req.json().catch(() => ({}));
    const tags = Array.isArray(body.tags) ? body.tags : [];

    const clean = tags
      .map((t: any) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);

    const auth = await getAuthedUserAndTenant();

    if (!auth?.tenant?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: auth.tenant.id,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.conversation.update({
      where: {
        id: conversation.id,
      },
data: {
  tags: clean.join(","),
},
    });

    return NextResponse.json({
      ok: true,
      conversation: updated,
    });
  } catch (error) {
    console.error("POST /api/conversations/[id]/tags failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}