// src/app/api/conversations/[id]/ai/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body.aiEnabled === false ? false : true;

  const convo = await prisma.conversation.updateMany({
    where: {
      id,
      tenantId: auth.tenant.id,
    },
    data: {
      aiEnabled,
      needsHuman: false,
      status: aiEnabled ? "open" : "waiting",
    },
  });

  if (convo.count === 0) {
    return NextResponse.json(
      { ok: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}