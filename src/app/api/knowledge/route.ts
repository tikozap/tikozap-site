// src/app/api/knowledge/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";

const DEFAULT_SECTIONS = [
  "Store info",
  "Shipping policy",
  "Return policy",
  "Product Knowledge",
  "Special Instructions",
  "FAQs",
];

export async function GET() {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const docs = await prisma.knowledgeDoc.findMany({
    where: {
      tenantId: auth.tenant.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
    },
  });

const docsByTitle = new Map(docs.map((doc) => [doc.title, doc]));

const mergedDocs = DEFAULT_SECTIONS.map((title) => {
  const existing = docsByTitle.get(title);

  return (
    existing || {
      id: "",
      title,
      content: "",
      updatedAt: "",
    }
  );
});

return NextResponse.json({
  ok: true,
  docs: mergedDocs,
  defaults: DEFAULT_SECTIONS,
});
}

export async function POST(req: Request) {
  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "";

const content =
  typeof body.content === "string"
    ? body.content.trim()
    : "";

  const id =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : "";

if (!title) {
  return NextResponse.json(
    { ok: false, error: "Title is required" },
    { status: 400 }
  );
}

  if (id) {
    const existing = await prisma.knowledgeDoc.findFirst({
      where: {
        id,
        tenantId: auth.tenant.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Knowledge item not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.knowledgeDoc.update({
      where: { id },
      data: {
        title,
        content,
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, doc: updated });
  }

  const created = await prisma.knowledgeDoc.create({
    data: {
      tenantId: auth.tenant.id,
      title,
      content,
    },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, doc: created });
}