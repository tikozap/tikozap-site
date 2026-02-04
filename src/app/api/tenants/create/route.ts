// src/app/api/tenants/create/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { newWidgetPublicKey } from "@/lib/widgetKey";

export const runtime = "nodejs";

const Body = z.object({
  storeName: z.string().min(2).max(80),
  allowedDomains: z.array(z.string().min(1)).optional(),
});

function slugify(input: string) {
  const s = (input || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return s || "workspace";
}

function getUserIdOrNull(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const m = cookieHeader.match(/(?:^|;\s*)tz_user_id=([^;]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);

  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  return null;
}

export async function POST(req: Request) {
  try {
    const userId = getUserIdOrNull(req);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated (missing tz_user_id / x-user-id)" },
        { status: 401 }
      );
    }

    const parsed = Body.parse(await req.json());
    const storeName = parsed.storeName.trim();

    const { prisma } = await import("@/lib/prisma");

    // unique slug
    const base = slugify(storeName);
    let slug = base;
    for (let i = 1; i < 50; i++) {
      const exists = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = `${base}-${i}`;
    }

    const created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          storeName,
          ownerId: userId,
          memberships: {
            create: { userId, role: "owner" },
          },
          widget: {
            create: {
              publicKey: newWidgetPublicKey(), // ✅ tz_...
              assistantName: `${storeName} Assistant`,
              greeting: `Hi! Welcome to ${storeName}. How can I help today?`,
              brandColor: "#111827",
              allowedDomains: parsed.allowedDomains ?? [],
            },
          },
        },
        // ✅ select MUST be sibling of data (NOT inside data)
        select: {
          id: true,
          slug: true,
          storeName: true,
          widget: { select: { publicKey: true } },
        },
      });

      return tenant;
    });

    const res = NextResponse.json({
      ok: true,
      tenant: {
        id: created.id,
        slug: created.slug,
        storeName: created.storeName,
        publicKey: created.widget?.publicKey ?? null,
      },
    });

    res.cookies.set("tz_tenant_id", created.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err: any) {
    console.error("[api/tenants/create] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Create workspace failed" }, { status: 500 });
  }
}
