// src/app/api/chat/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { runTikoBrain } from "@/lib/brain";
import {
  appendDemoInboxMessage,
  findOrCreateDemoInboxConversation,
} from "@/lib/demoInboxStore";

type ChatBody = {
  message?: string;
  conversationId?: string | null;
  image?: string | null;
};

function streamSSE(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function splitIntoChunks(text: string, size = 24) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatBody;
    const message = body.message?.trim() || "";

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    const conversation = findOrCreateDemoInboxConversation({
      tenantId: "demo-tenant",
      conversationId: body.conversationId || undefined,
      customerName: "Demo visitor",
      subject: "Demo chat",
      channel: "demo",
      tags: ["demo", "orb"],
    });

    appendDemoInboxMessage(conversation.id, "customer", message);

    const brain = await runTikoBrain({
      message,
      history: [],
    });

    const answer = brain.reply;
    const products = brain.products;

    appendDemoInboxMessage(
      conversation.id,
      "assistant",
      answer,
      products
    );

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            streamSSE({
              type: "meta",
              conversationId: conversation.id,
              remaining: 999,
              dailyLimit: 999,
              userType: "anonymous",
            })
          )
        );

        for (const chunk of splitIntoChunks(answer, 18)) {
          controller.enqueue(
            new TextEncoder().encode(
              streamSSE({
                type: "delta",
                delta: chunk,
              })
            )
          );
          await new Promise((r) => setTimeout(r, 35));
        }

        controller.enqueue(
          new TextEncoder().encode(
            streamSSE({
              type: "final",
              conversationId: conversation.id,
              remaining: 999,
              dailyLimit: 999,
              userType: "anonymous",
              products,
            })
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("CHAT_ROUTE_FATAL", error);

    return NextResponse.json(
      {
        error: "Chat route failed",
        detail: error?.message ?? "Unknown server error",
      },
      { status: 500 }
    );
  }
}