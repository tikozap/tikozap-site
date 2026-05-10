// src/app/api/conversations/[id]/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDemoInboxConversation } from "@/lib/demoInboxStore";

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

function splitTags(tags: string | null | undefined) {
  return String(tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function findRealTenantIdFromDemoSession(auth: any) {
  if (!auth) return null;

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: auth.tenant.id },
        { slug: auth.tenant.slug },
        { storeName: auth.tenant.storeName },
      ],
    },
    select: { id: true },
  });

  return tenant?.id || null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const realTenantId =
    (await findRealTenantIdFromDemoSession(auth)) || auth.tenant.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      tenantId: realTenantId,
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
          createdAt: true,
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
  products: [],
})),
    },
  });
}