// src/app/api/conversations/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
import {
  appendDemoInboxMessage,
  findOrCreateDemoInboxConversation,
  listDemoInboxConversations,
} from "@/lib/demoInboxStore";
import { buildSupportReply } from "@/lib/supportAssistant";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const includeArchived = url.searchParams.get("includeArchived") === "1";

  const conversations = listDemoInboxConversations(includeArchived);

  return NextResponse.json({
    ok: true,
    conversations,
  });
}

export async function POST(req: Request) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body?.aiEnabled === false ? false : true;

  const convo = findOrCreateDemoInboxConversation({
    tenantId: "demo-tenant",
    customerName: "Website shopper",
    subject: "New test chat",
    channel: "web",
    tags: [],
  });

  convo.aiEnabled = aiEnabled;
  convo.status = aiEnabled ? "open" : "waiting";
  convo.needsHuman = !aiEnabled;
  convo.unread = true;

  appendDemoInboxMessage(convo.id, "customer", "Hello, I need help with my order.");

  if (aiEnabled) {
    appendDemoInboxMessage(
      convo.id,
      "assistant",
      buildSupportReply("Hello, I need help with my order.").reply
    );
    convo.unread = false;
  }

  return NextResponse.json({
    ok: true,
    id: convo.id,
  });
}