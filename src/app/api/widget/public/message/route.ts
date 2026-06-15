// src/app/api/widget/public/message/route.ts

import { wantsHuman } from "@/lib/handoffIntent";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTikoBrain } from "@/lib/brain";
import { extractRequestHost, isAllowedDomain } from "@/lib/widgetDomain";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { canCreateConversationForTenant } from "@/lib/billingUsage";

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

async function getStoreKnowledge(tenantId: string) {
  const docs = await prisma.knowledgeDoc.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      title: true,
      content: true,
    },
  });

  return docs
    .filter((d) => d.content.trim())
    .map((d) => `## ${d.title}\n${d.content.trim()}`)
    .join("\n\n");
}

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

const HUMAN_HANDOFF_REPLY =
  "Understood — I’m flagging this conversation for human follow-up now. A team member can take over from here.";

const HUMAN_STILL_WAITING_REPLY =
  "I understand you're still waiting. The team may be occupied right now, but I’m here and I’ll continue helping as best I can while you wait.";

function tagsForChannel(channel: string) {
  return channel === "starter-link" ? "starter-link,no-website" : "widget";
}

export async function POST(req: Request) {
  try {

    const rl = checkRateLimit(req, {
      namespace: "widget-public-message",
      limit: 20,
      windowMs: 60_000,
    });

    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many messages. Please try again shortly." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders(rl),
            "cache-control": "no-store",
          },
        }
      );
    }

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

    const widget = await prisma.widget.findFirst({
      where: {
        publicKey: key,
        enabled: true,
      },
select: {
  tenantId: true,
  allowedDomains: true,
},
    });

    if (!widget) {
      return NextResponse.json(
        { ok: false, error: "Invalid widget key" },
        {
          status: 404,
          headers: { ...corsHeaders, "cache-control": "no-store" },
        }
      );
    }

    const requestHost = extractRequestHost(req);

    if (!isAllowedDomain(requestHost, widget.allowedDomains || [])) {
      return NextResponse.json(
        { ok: false, error: "Widget is not allowed on this domain" },
        {
          status: 403,
          headers: { ...corsHeaders, "cache-control": "no-store" },
        }
      );
    }

    let conversation =
      clientConversationId
        ? await prisma.conversation.findFirst({
            where: {
              id: clientConversationId,
              tenantId: widget.tenantId,
            },
select: {
  id: true,
  aiEnabled: true,
  status: true,
  needsHuman: true,
  lastMessageAt: true,
},
          })
        : null;

        if (!conversation) {
      const billing = await canCreateConversationForTenant(widget.tenantId);

      if (!billing.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "This store has reached its monthly conversation limit.",
            usage: billing.usage,
          },
          {
            status: 402,
            headers: { ...corsHeaders, "cache-control": "no-store" },
          }
        );
      }

      conversation = await prisma.conversation.create({
        data: {
          tenantId: widget.tenantId,
          customerName,
          subject,
          channel,
          aiEnabled: true,
          status: "open",
          tags: tagsForChannel(channel),
          needsHuman: false,
        },
select: {
  id: true,
  aiEnabled: true,
  status: true,
  needsHuman: true,
  lastMessageAt: true,
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

console.log("[TikoZap wantsHuman]", text, wantsHuman(text));
if (wantsHuman(text)) {

  // Customer already waiting for human earlier.
  // AI may have auto-resumed after staff inactivity.
  if (conversation.needsHuman) {

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: HUMAN_STILL_WAITING_REPLY,
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

    return NextResponse.json(
      {
        ok: true,
        conversationId: conversation.id,
        channel,
        subject,
        messages: [
          { role: "customer", content: text },
          { role: "assistant", content: HUMAN_STILL_WAITING_REPLY },
        ],
        products: [],
      },
      {
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }

  // First-time human request
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

const storeKnowledge = await getStoreKnowledge(widget.tenantId);

const result = await runTikoBrain({
  message: text,
  history,
  storeKnowledge,
});

await prisma.message.create({
  data: {
    conversationId: conversation.id,
    role: "assistant",
    content: result.reply,
    productsJson:
      result.products && result.products.length > 0
        ? JSON.stringify(result.products)
        : null,
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
  } catch (error: any) {
    console.error("PUBLIC_WIDGET_MESSAGE_FATAL", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      {
        status: 500,
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }
}