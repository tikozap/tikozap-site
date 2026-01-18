// src/app/api/widget/public/message/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Debug endpoint to prove the route exists in prod
export async function GET() {
  return NextResponse.json(
    { ok: true, route: "/api/widget/public/message", now: new Date().toISOString() },
    { headers: corsHeaders }
  );
}

const Body = z.object({
  key: z.string().min(8).max(200),
  text: z.string().min(1).max(4000),

  customerName: z.string().max(120).optional().nullable(),
  customerEmail: z.string().max(200).optional().nullable(),
  subject: z.string().max(160).optional().nullable(),
  channel: z.string().max(40).optional().nullable(),
  tags: z.string().max(300).optional().nullable(),
  aiEnabled: z.boolean().optional().nullable(),

  conversationId: z.string().optional().nullable(),
});

function assistantAutoReply(customerText: string) {
  const t = (customerText || "").toLowerCase();
  if (t.includes("return"))
    return "Returns are accepted within 30 days if items are unworn with tags. Want me to outline the return steps?";
  if (t.includes("ship") || t.includes("delivery"))
    return "Orders ship in 1–2 business days. Typical US delivery is 3–7 business days. What’s your ZIP code?";
  if (t.includes("order") || t.includes("tracking"))
    return "I can help—please share your order number and the email used at checkout so I can check the status.";
  if (t.includes("xl") || t.includes("size"))
    return "I can help with sizing. Which item are you looking at, and what size do you usually wear?";
  return "Got it. Can you share a little more detail so I can help faster?";
}

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());

    const { prisma } = await import("@/lib/prisma");
    const { storeAssistantReply } = await import("@/lib/assistant/storeAssistant");

    // 1) Resolve tenant by public key
    const widget = await prisma.widget.findUnique({
      where: { publicKey: body.key },
      select: { tenantId: true, enabled: true },
    });

    if (!widget || widget.enabled === false) {
      return NextResponse.json(
        { ok: false, error: "Widget not found or disabled" },
        { status: 404, headers: corsHeaders }
      );
    }

    const tenantId = widget.tenantId;

    const customerName =
      (body.customerName || "Customer").toString().trim() || "Customer";
    const customerEmail =
      (body.customerEmail || "").toString().trim() || null;

    const channel = (body.channel || "web").toString().trim() || "web";
    const subject = (body.subject || "Support").toString().trim() || "Support";
    const tags = (body.tags || "").toString();

    const aiEnabled = body.aiEnabled === false ? false : true;

    let conversationId = (body.conversationId || "").toString().trim();
    let allowAi = aiEnabled;

    // 2) If continuing, confirm convo belongs to tenant
    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId },
        select: { id: true, aiEnabled: true },
      });

      if (!existing?.id) {
        return NextResponse.json(
          { ok: false, error: "Conversation not found for tenant" },
          { status: 404, headers: corsHeaders }
        );
      }

      if (typeof existing.aiEnabled === "boolean") allowAi = existing.aiEnabled;
    }

    // 3) Create conversation if new
    if (!conversationId) {
      const convo = await prisma.conversation.create({
        data: {
          tenantId,
          customerName,
          customerEmail,
          subject,
          channel,
          tags,
          aiEnabled,
          status: aiEnabled ? "open" : "waiting",
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });
      conversationId = convo.id;
    }

    // 4) Save customer message
    await prisma.message.create({
      data: {
        conversationId,
        role: "customer",
        content: body.text.trim(),
      },
    });

    // 5) Re-check allowAi from DB (staff takeover wins)
    try {
      const row = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { aiEnabled: true },
      });
      if (typeof row?.aiEnabled === "boolean") allowAi = row.aiEnabled;
    } catch {}

    // 6) AI reply
    if (allowAi) {
      let reply = "";
      try {
        reply = await storeAssistantReply({
          tenantId,
          conversationId,
          userText: body.text.trim(),
          channel,
        });
      } catch (e) {
        console.error("[public/widget/message] storeAssistantReply failed; fallback", e);
        reply = assistantAutoReply(body.text);
      }

      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply || assistantAutoReply(body.text),
        },
      });
    }

    // 7) Update lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, conversationId, messages },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[public/widget/message] error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Public widget message failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
