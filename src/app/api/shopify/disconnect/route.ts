// src/app/api/shopify/disconnect/route.ts

import "server-only";

import { NextResponse } from "next/server";

import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/security/requireSameOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

  try {
    const result = await prisma.shopifyConnection.deleteMany({
      where: {
        tenantId: auth.tenant.id,
      },
    });

    return NextResponse.json({
      ok: true,
      disconnected: result.count > 0,
    });
  } catch (error) {
    console.error("[shopify-disconnect]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to disconnect Shopify.",
      },
      {
        status: 500,
      }
    );
  }
}
