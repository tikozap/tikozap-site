// src/app/api/conversations/test-assistant/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runTikoBrain } from "@/lib/brain";
import { resolveProductProvider } from "@/lib/resolveProductProvider";
import {
  appendDemoInboxMessage,
  findOrCreateDemoInboxConversation,
} from "@/lib/demoInboxStore";
import {
  getAssistantIdentity,
  getAssistantLearning,
  getStoreKnowledge,
} from "@/lib/assistantContext";

export const runtime = "nodejs";

function normalize(value: unknown) {
  return String(value || "").trim();
}

async function findRealTenantId(auth: any) {
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
  try {
    const auth = await getAuthedUserAndTenant();

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = normalize(body?.text);

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Missing text" },
        { status: 400 }
      );
    }

    const realTenantId = auth.tenant.id;
    const conversationId = normalize(body?.conversationId);

let convoId = conversationId;

if (convoId) {
  const existing = await prisma.conversation.findFirst({
    where: {
      id: convoId,
      tenantId: realTenantId,
    },
    select: { id: true },
  });

  if (!existing) convoId = "";
}

const recentMessages = convoId
  ? await prisma.message.findMany({
      where: {
        conversationId: convoId,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 12,
      select: {
        role: true,
        content: true,
      },
    })
  : [];

const [
  assistantIdentity,
  assistantLearning,
  productProvider,
] = await Promise.all([
  getAssistantIdentity(realTenantId),
  getAssistantLearning(realTenantId),
  resolveProductProvider(realTenantId),
]);

const storeKnowledge = await getStoreKnowledge(
  realTenantId,
  assistantIdentity.name
);

const result = await runTikoBrain({
  message: text,
  history: recentMessages.map((message) => ({
    role: message.role,
    content: message.content,
  })),
  storeKnowledge,
  assistantLearning,
  productProvider,
});

    // DEMO FALLBACK
    if (!realTenantId) {
      const convo = findOrCreateDemoInboxConversation({
        tenantId: "demo-tenant",
        customerName: "Onboarding Test Shopper",
        subject: "Assistant test",
        channel: "dashboard",
        tags: ["test"],
      });

      appendDemoInboxMessage(convo.id, "customer", text);
      appendDemoInboxMessage(
        convo.id,
        "assistant",
        result.reply,
        result.products
      );

      return NextResponse.json({
        ok: true,
        id: convo.id,
      });
    }

    // REAL PRISMA

if (!convoId) {
  const convo = await prisma.conversation.create({
    data: {
      tenantId: realTenantId,
      customerName: "Onboarding Test Shopper",
      subject: "Assistant test",
      channel: "dashboard",
      status: "open",
      aiEnabled: true,
      tags: "test",
    },
    select: { id: true },
  });

  convoId = convo.id;
}

await prisma.message.create({
  data: {
    conversationId: convoId,
    role: "customer",
    content: text,
  },
});

await prisma.message.create({
  data: {
    conversationId: convoId,
    role: "assistant",
    content: result.reply,
  },
});

await prisma.conversation.update({
  where: { id: convoId },
  data: {
    lastMessageAt: new Date(),
  },
});

return NextResponse.json({
  ok: true,
  id: convoId,
});
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Server error",
      },
      { status: 500 }
    );
  }
}