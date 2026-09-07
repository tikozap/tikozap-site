// src/app/api/conversations/[id]/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function orderMessages(messages: any[]) {
  const sorted = [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();

    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (
      a.role === "assistant" &&
      b.role === "customer" &&
      bTime >= aTime &&
      bTime - aTime <= 8000
    ) {
      sorted[i] = b;
      sorted[i + 1] = a;
      i++;
    }
  }

  return sorted;
}

function parseProductsJson(input: string | null | undefined) {
  if (!input) return [];

  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function splitTags(tags: string | null | undefined) {
  return String(tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      tenantId: auth.tenant.id,
    },
    select: {
      id: true,
      tenantId: true,
      channel: true,
      status: true,
      aiEnabled: true,
      customerName: true,
      customerEmail: true,
      subject: true,
      tags: true,
      createdAt: true,
      lastMessageAt: true,
      archivedAt: true,
      needsHuman: true,
      lastSeenAt: true,
      messages: {
  orderBy: [
    { createdAt: "asc" },
    { id: "asc" },
  ],
select: {
  id: true,
  role: true,
  content: true,
  source: true,
  createdAt: true,
  productsJson: true,
},
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { ok: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    conversation: {
      ...conversation,
      tags: splitTags(conversation.tags),
      unread: conversation.lastSeenAt < conversation.lastMessageAt,
      messages: orderMessages(conversation.messages).map((m) => ({
  ...m,
  products: parseProductsJson(m.productsJson),
})),
    },
  });
}