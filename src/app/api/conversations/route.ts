// src/app/api/conversations/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';
import { buildSupportReply } from "@/lib/supportAssistant";

export const runtime = "nodejs";

function splitTags(tags: string | null | undefined) {
  return String(tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const includeArchived = url.searchParams.get("includeArchived") === "1";

  const realTenantId = auth.tenant.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      tenantId: realTenantId,
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    select: {
      id: true,
      customerName: true,
      subject: true,
      status: true,
      channel: true,
      aiEnabled: true,
      tags: true,
      lastMessageAt: true,
      archivedAt: true,
      needsHuman: true,
      lastSeenAt: true,
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    conversations: conversations.map((c) => ({
      id: c.id,
      customerName: c.customerName,
      subject: c.subject,
      status: c.status,
      channel: c.channel,
      aiEnabled: c.aiEnabled,
      tags: splitTags(c.tags),
      lastMessageAt: c.lastMessageAt,
      archivedAt: c.archivedAt,
      needsHuman: c.needsHuman,
      unread: c.lastSeenAt < c.lastMessageAt,
      preview: c.messages[0]
        ? {
            role: c.messages[0].role,
            content: c.messages[0].content,
            createdAt: c.messages[0].createdAt,
          }
        : null,
    })),
  });
}

export async function POST(req: Request) {
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
  const aiEnabled = body?.aiEnabled === false ? false : true;

  const realTenantId = auth.tenant.id;

  const convo = await prisma.conversation.create({
    data: {
      tenantId: realTenantId,
      customerName: "Website shopper",
      subject: "New test chat",
      channel: "web",
      aiEnabled,
      status: aiEnabled ? "open" : "waiting",
      needsHuman: !aiEnabled,
      tags: "",
    },
    select: {
      id: true,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: "customer",
      content: "Hello, I need help with my order.",
    },
  });

  if (aiEnabled) {
    await prisma.message.create({
      data: {
        conversationId: convo.id,
        role: "assistant",
        content: buildSupportReply("Hello, I need help with my order.").reply,
      },
    });
  }

  await prisma.conversation.update({
    where: { id: convo.id },
    data: {
      lastMessageAt: new Date(),
      lastSeenAt: aiEnabled ? new Date() : undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    id: convo.id,
  });
}
