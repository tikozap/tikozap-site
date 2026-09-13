// src/app/api/conversations/test-assistant/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runTikoBrain } from "@/lib/brain";
import { resolveProductProvider } from "@/lib/resolveProductProvider";
import {
  getAssistantIdentity,
  getAssistantLearning,
  getStoreKnowledge,
} from "@/lib/assistantContext";
import {
  getTenantEntitlement,
  TRIAL_PAUSED_MERCHANT_MESSAGE,
} from "@/lib/tenantEntitlement";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = "nodejs";

function normalize(value: unknown) {
  return String(value || "").trim();
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

    if (text.length > 12000) {
  return NextResponse.json(
    { ok: false, error: "Message is too long." },
    { status: 400 }
  );
}

    const realTenantId = auth.tenant.id;

const entitlement = await getTenantEntitlement(realTenantId);

if (!entitlement.ok) {
  return NextResponse.json(
    {
      ok: false,
      reason: "TRIAL_EXPIRED",
      error: TRIAL_PAUSED_MERCHANT_MESSAGE,
    },
    { status: 402 }
  );
}

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
    console.error('[test-assistant]', error);

    return NextResponse.json(
      {
        ok: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}