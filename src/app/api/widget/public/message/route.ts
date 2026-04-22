// src/app/api/widget/public/message/route.ts

import { NextResponse } from "next/server";
import { runTikoBrain } from "@/lib/brain";
import {
  appendDemoInboxMessage,
  findOrCreateDemoInboxConversation,
} from "@/lib/demoInboxStore";

export const runtime = "nodejs";

type ChatRole = "customer" | "assistant" | "staff";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function extractHistory(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        "role" in m &&
        "content" in m &&
        typeof (m as any).content === "string"
    )
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const key = normalizeText(body?.key);
  const text = normalizeText(body?.text);
  const clientConversationId = normalizeText(body?.conversationId) || "";
  const channel = normalizeText(body?.channel) || "web";
  const subject = normalizeText(body?.subject) || "Website chat";
  const history = extractHistory(body?.history);
  const customerName =
    normalizeText(body?.visitor?.name) || "Website visitor";

  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Missing key" },
      {
        status: 400,
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }

  if (!text) {
    return NextResponse.json(
      { ok: false, error: "Missing text" },
      {
        status: 400,
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }

  const conversation = findOrCreateDemoInboxConversation({
    tenantId: "demo-tenant",
    conversationId: clientConversationId || undefined,
    customerName,
    subject,
    channel,
    tags:
      channel === "starter-link"
        ? ["starter-link", "no-website"]
        : ["widget"],
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

    return NextResponse.json(
      {
        ok: true,
        conversationId: conversation.id,
        channel,
        subject,
        messages: [
          { role: "customer", content: text },
          { role: "assistant", content: HUMAN_HANDOFF_REPLY },
        ],
        products: [],
      },
      {
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }

  const result = await runTikoBrain({
    message: text,
    history,
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

  return NextResponse.json(
    {
      ok: true,
      conversationId: conversation.id,
      channel,
      subject,
      messages: [
        { role: "customer", content: text },
        { role: "assistant", content: result.reply },
      ],
      products: result.products,
    },
    {
      headers: { ...corsHeaders, "cache-control": "no-store" },
    }
  );
}