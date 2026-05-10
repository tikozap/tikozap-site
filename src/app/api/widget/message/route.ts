// src/app/api/widget/message/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTikoBrain } from "@/lib/brain";
import {
  appendDemoInboxMessage,
  findOrCreateDemoInboxConversation,
  getDemoInboxConversation,
} from "@/lib/demoInboxStore";

export const runtime = "nodejs";

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function wantsHuman(text: string) {
  const s = text.toLowerCase();

  return [
    "talk to a human",
    "speak to a human",
    "talk to a person",
    "speak to a person",
    "real person",
    "human agent",
    "human",
    "agent",
    "representative",
    "customer service",
    "someone help",
    "call me",
  ].some((term) => s.includes(term));
}

const HUMAN_HANDOFF_REPLY =
  "Understood — I’m flagging this conversation for human follow-up now. A team member can take over from here.";

function normalizeTags(tagsRaw: string) {
  return tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).join(",")
    : "";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const publicKey = normalizeText(body?.key);
  const customerName =
    normalizeText(body?.customerName) || "Sophia (Widget Test)";
  const subject = normalizeText(body?.subject) || "Widget test";
  const channel = normalizeText(body?.channel) || "web";
  const text = normalizeText(body?.text);
  const conversationId = normalizeText(body?.conversationId) || "";
  const tagsRaw = normalizeText(body?.tags);
  const tags = normalizeTags(tagsRaw);

  if (!text) {
    return NextResponse.json(
      { ok: false, error: "Missing text" },
      { status: 400 }
    );
  }

  // DEMO FALLBACK
  if (!publicKey || publicKey === "tz_demo_demo") {
    const conversation = findOrCreateDemoInboxConversation({
      tenantId: "demo-tenant",
      conversationId: conversationId || undefined,
      customerName,
      subject,
      channel,
      tags: tags ? tags.split(",") : [],
    });

    appendDemoInboxMessage(conversation.id, "customer", text);

    if (wantsHuman(text)) {
      conversation.needsHuman = true;
      conversation.status = "waiting";
      conversation.aiEnabled = false;

      appendDemoInboxMessage(
        conversation.id,
        "assistant",
        HUMAN_HANDOFF_REPLY
      );

      const updated = getDemoInboxConversation(conversation.id);

      return NextResponse.json({
        ok: true,
        conversationId: conversation.id,
        messages: updated?.messages ?? [
          { role: "customer", content: text },
          { role: "assistant", content: HUMAN_HANDOFF_REPLY },
        ],
        products: [],
      });
    }

    const result = await runTikoBrain({
      message: text,
      history: [],
    });

    appendDemoInboxMessage(
      conversation.id,
      "assistant",
      result.reply,
      result.products
    );

    conversation.needsHuman = false;
    if (conversation.status !== "closed") {
      conversation.status = conversation.aiEnabled ? "open" : "waiting";
    }

    const updated = getDemoInboxConversation(conversation.id);

    return NextResponse.json({
      ok: true,
      conversationId: conversation.id,
      messages: updated?.messages ?? [
        { role: "customer", content: text },
        { role: "assistant", content: result.reply },
      ],
      products: result.products,
    });
  }

  // REAL PRISMA PATH
  const widget = await prisma.widget.findFirst({
    where: {
      publicKey,
      enabled: true,
    },
    select: {
      tenantId: true,
    },
  });

  if (!widget) {
    return NextResponse.json(
      { ok: false, error: "Invalid widget key" },
      { status: 404 }
    );
  }

  let conversation =
    conversationId
      ? await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            tenantId: widget.tenantId,
          },
          select: {
            id: true,
            aiEnabled: true,
            status: true,
          },
        })
      : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        tenantId: widget.tenantId,
        customerName,
        subject,
        channel,
        aiEnabled: true,
        status: "open",
        tags,
        needsHuman: false,
      },
      select: {
        id: true,
        aiEnabled: true,
        status: true,
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "customer",
      content: text,
    },
  });

  if (wantsHuman(text)) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: HUMAN_HANDOFF_REPLY,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        needsHuman: true,
        status: "waiting",
        aiEnabled: false,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      conversationId: conversation.id,
      messages: [
        { role: "customer", content: text },
        { role: "assistant", content: HUMAN_HANDOFF_REPLY },
      ],
      products: [],
    });
  }

  const result = await runTikoBrain({
    message: text,
    history: [],
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: result.reply,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      needsHuman: false,
      status: conversation.aiEnabled ? "open" : "waiting",
      lastMessageAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    conversationId: conversation.id,
    messages: [
      { role: "customer", content: text },
      { role: "assistant", content: result.reply },
    ],
    products: result.products,
  });
}