// src/app/api/widget/public/thread/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { extractRequestHost, isAllowedDomain } from "@/lib/widgetDomain";

export const runtime = "nodejs";

function orderMessages(messages: any[]) {
  const sorted = [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();

    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();

    if (
      a.role === "assistant" &&
      b.role === "customer" &&
      bTime >= aTime &&
      bTime - aTime <= 8000
    ) {
      sorted[i] = b;
      sorted[i + 1] = a;
      i++;
    }
  }

  return sorted;
}

function parseProductsJson(input: string | null | undefined) {
  if (!input) return [];

  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const Query = z.object({
  key: z.string().min(2).max(200),
  conversationId: z.string().min(2).max(200),
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const parsed = Query.safeParse({
      key: searchParams.get("key") || "",
      conversationId: searchParams.get("conversationId") || "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        {
          status: 400,
          headers: { ...corsHeaders, "cache-control": "no-store" },
        }
      );
    }

    const { key, conversationId } = parsed.data;

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

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId: widget.tenantId,
      },
      select: {
        id: true,
        messages: {
          where: {
            role: {
              not: "note",
            },
          },
          orderBy: [
  { createdAt: "asc" },
  { id: "asc" },
],
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            productsJson: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        {
          status: 404,
          headers: { ...corsHeaders, "cache-control": "no-store" },
        }
      );
    }

const messages = orderMessages(conversation.messages).map((m) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  createdAt: m.createdAt,
  products: parseProductsJson(m.productsJson),
}));

return NextResponse.json(
  {
    ok: true,
    conversationId: conversation.id,
    messages,
  },
      {
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      {
        status: 500,
        headers: { ...corsHeaders, "cache-control": "no-store" },
      }
    );
  }
}