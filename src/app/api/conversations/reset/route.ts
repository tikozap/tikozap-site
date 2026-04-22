// src/app/api/conversations/reset/route.ts

import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demoAuth";
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

export async function POST(req: Request) {
  const auth = await getDemoSession();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const aiEnabled = body?.aiEnabled === false ? false : true;

  // Reset the in-memory demo store by overwriting the known demo IDs.
  const seeds = buildDemoSeeds(aiEnabled);

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