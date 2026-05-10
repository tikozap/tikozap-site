// src/app/api/widget/public/voice-message/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function wantsHuman(text: string) {
  const s = text.toLowerCase();
  return [
    "human",
    "human agent",
    "human assistant",
    "manager",
    "representative",
    "real person",
    "live agent",
    "talk to someone",
    "speak to someone",
    "call me",
    "phone number",
  ].some((x) => s.includes(x));
}

function clean(input: unknown) {
  return String(input || "").trim();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const publicKey = clean(body.publicKey);
  const conversationId = clean(body.conversationId);
  const messageId = clean(body.messageId);
  const role = clean(body.role);
  const content = clean(body.content);
  const customerContent = clean(body.customerContent);

  if (!publicKey || !content) {
    return NextResponse.json(
      { ok: false, error: "Missing publicKey or content." },
      { status: 400 }
    );
  }

  const widget = await prisma.widget.findUnique({
    where: { publicKey },
    select: { tenantId: true },
  });

  if (!widget) {
    return NextResponse.json(
      { ok: false, error: "Widget not found." },
      { status: 404 }
    );
  }

  let convo =
    conversationId
      ? await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            tenantId: widget.tenantId,
          },
          select: { id: true },
        })
      : null;

  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        tenantId: widget.tenantId,
        customerName: "Voice visitor",
        subject: "Voice conversation",
        channel: "starter-link-voice",
        status: "open",
        aiEnabled: true,
        tags: "starter-link,voice",
        needsHuman: false,
      },
      select: { id: true },
    });
  }

  const finalRole =
    role === "assistant" || role === "customer" ? role : "customer";

  // Voice turn mode:
  // Save customer question and assistant answer together, in the correct order.
  if (finalRole === "assistant" && customerContent && content) {
    const now = Date.now();

    const customerMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        role: "customer",
        content: customerContent,
        createdAt: new Date(now),
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        role: "assistant",
        content,
        createdAt: new Date(now + 10),
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    await prisma.conversation.update({
      where: { id: convo.id },
      data: {
        lastMessageAt: new Date(now + 10),
        archivedAt: null,
        status: "open",
        needsHuman: false,
      },
    });

    return NextResponse.json({
      ok: true,
      conversationId: convo.id,
      messageId: assistantMessage.id,
      customerMessageId: customerMessage.id,
    });
  }
  let savedMessage;

  if (messageId) {
    savedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
  } else {
    savedMessage = await prisma.message.create({
      data: {
        conversationId: convo.id,
        role: finalRole,
        content,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });
  }

  const shouldAlertHuman = finalRole === "customer" && wantsHuman(content);

  await prisma.conversation.update({
    where: { id: convo.id },
    data: {
      lastMessageAt: new Date(),
      archivedAt: null,
      status: shouldAlertHuman ? "waiting" : "open",
      needsHuman: shouldAlertHuman ? true : undefined,
      aiEnabled: shouldAlertHuman ? false : undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    conversationId: convo.id,
    messageId: savedMessage.id,
  });
}