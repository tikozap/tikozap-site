// src/app/api/conversations/[id]/seen/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/security/requireSameOrigin";

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
        error: "Invalid request origin.",
      },
      {
        status: 403,
      }
    );
  }

  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const updated = await prisma.conversation.updateMany({
    where: {
      id,
      tenantId: auth.tenant.id,
    },
    data: {
      lastSeenAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Conversation not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    ok: true,
  });
}