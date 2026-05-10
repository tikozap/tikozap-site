// src/app/api/conversations/reset/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
import { prisma } from "@/lib/prisma";
import {
  appendDemoInboxMessage,
  findOrCreateDemoInboxConversation,
  listDemoInboxConversations,
} from "@/lib/demoInboxStore";
import { buildSupportReply } from "@/lib/supportAssistant";

export const runtime = "nodejs";

type SeedMessage = {
  role: "customer" | "assistant" | "staff";
  content: string;
};

type SeedConversation = {
  id: string;
  customerName: string;
  subject: string;
  tags: string[];
  channel: string;
  status: "open" | "waiting" | "closed";
  aiEnabled: boolean;
  messages: SeedMessage[];
};

function buildDemoSeeds(aiEnabled: boolean): SeedConversation[] {
  const assistantFor = (text: string): SeedMessage[] =>
    aiEnabled ? [{ role: "assistant", content: buildSupportReply(text).reply }] : [];

  return [
    {
      id: "demo-1",
      customerName: "Emily R.",
      subject: "Show me jackets",
      tags: [],
      channel: "web",
      status: aiEnabled ? "open" : "waiting",
      aiEnabled,
      messages: [
        { role: "customer", content: "Show me jackets" },
        ...assistantFor("Show me jackets"),
      ],
    },
    {
      id: "demo-2",
      customerName: "John D. · Order #1438",
      subject: "Where is my order?",
      tags: [],
      channel: "email",
      status: "waiting",
      aiEnabled: false,
      messages: [
        { role: "customer", content: "Where is my order? I placed it last week." },
      ],
    },
    {
      id: "demo-3",
      customerName: "Sophia",
      subject: "Return policy question",
      tags: [],
      channel: "web",
      status: aiEnabled ? "open" : "waiting",
      aiEnabled,
      messages: [
        { role: "customer", content: "What is your return policy?" },
        ...assistantFor("What is your return policy?"),
      ],
    },
  ];
}

function splitTags(tags: string[]) {
  return tags.join(",");
}

async function findRealTenantIdFromDemoSession(
  auth: Awaited<ReturnType<typeof getDemoSession>>
) {
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

export async function POST(req: Request) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body?.aiEnabled === false ? false : true;
  const seeds = buildDemoSeeds(aiEnabled);

  const realTenantId = await findRealTenantIdFromDemoSession(auth);

  // DEMO FALLBACK
  if (!realTenantId) {
    for (const seed of seeds) {
      const convo = findOrCreateDemoInboxConversation({
        tenantId: "demo-tenant",
        conversationId: seed.id,
        customerName: seed.customerName,
        subject: seed.subject,
        channel: seed.channel,
        tags: seed.tags,
      });

      convo.status = seed.status;
      convo.aiEnabled = seed.aiEnabled;
      convo.tags = [...seed.tags];
      convo.archivedAt = null;
      convo.needsHuman = seed.status === "waiting";
      convo.unread = false;
      convo.messages = [];
      convo.lastMessageAt = new Date().toISOString();

      for (const msg of seed.messages) {
        appendDemoInboxMessage(convo.id, msg.role, msg.content);
      }

      convo.unread = seed.messages.some((m) => m.role === "customer");
      convo.needsHuman = convo.status === "waiting";
    }

    return NextResponse.json({
      ok: true,
      conversations: listDemoInboxConversations(false),
    });
  }

  // REAL PRISMA PATH
  await prisma.message.deleteMany({
    where: {
      conversation: {
        tenantId: realTenantId,
      },
    },
  });

  await prisma.conversation.deleteMany({
    where: {
      tenantId: realTenantId,
    },
  });

  for (const seed of seeds) {
    const convo = await prisma.conversation.create({
      data: {
        tenantId: realTenantId,
        customerName: seed.customerName,
        subject: seed.subject,
        channel: seed.channel,
        status: seed.status,
        aiEnabled: seed.aiEnabled,
        tags: splitTags(seed.tags),
        archivedAt: null,
        needsHuman: seed.status === "waiting",
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    for (const msg of seed.messages) {
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          role: msg.role,
          content: msg.content,
        },
      });
    }

    await prisma.conversation.update({
      where: { id: convo.id },
      data: {
        lastMessageAt: new Date(),
        lastSeenAt: seed.messages.some((m) => m.role === "customer")
          ? new Date(0)
          : new Date(),
      },
    });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      tenantId: realTenantId,
      archivedAt: null,
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
      tags: String(c.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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