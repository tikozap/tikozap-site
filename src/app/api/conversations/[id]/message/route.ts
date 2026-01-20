// src/app/api/conversations/[id]/message/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";

const BodySchema = z.object({
  text: z.string().min(1).max(8000),
  internal: z.boolean().optional(),
  // optional explicit role override (mainly for debugging / future UI)
  role: z.enum(["staff", "note"]).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const { text, internal, role: roleOverride } = parsed.data;

  // Role strategy:
  // - explicit role wins
  // - else internal => note
  // - else staff
  const role: "staff" | "note" = roleOverride ?? (internal ? "note" : "staff");

  // Ensure conversation belongs to current tenant
  const conv = await prisma.conversation.findFirst({
    where: { id: params.id, tenantId: auth.tenant.id },
    select: { id: true, lastMessageAt: true },
  });

  if (!conv) {
    return NextResponse.json(
      { ok: false, error: "Conversation not found" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      role,
      content: text,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  // Update inbox timestamp ONLY for staff replies (not internal notes)
  if (role === "staff") {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: message.createdAt },
    });
  }

  return NextResponse.json(
    { ok: true, conversationId: conv.id, message },
    { headers: { "cache-control": "no-store" } }
  );
}
