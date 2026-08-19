// src/app/api/conversations/[id]/message/route.ts

import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveAssistantCoaching } from "@/lib/assistantCoaching";
import {
  getTenantEntitlement,
  TRIAL_PAUSED_MERCHANT_MESSAGE,
} from "@/lib/tenantEntitlement";
import { requireSameOrigin } from '@/lib/security/requireSameOrigin';

export const runtime = "nodejs";

function validateMessageImage(value: unknown) {
  if (!value || typeof value !== "object") {
    return true;
  }

  const item = value as Record<string, unknown>;

  if (
    item.type !== "image" &&
    typeof item.dataUrl !== "string"
  ) {
    return true;
  }

  const dataUrl = String(item.dataUrl || "").trim();

  if (
    !/^data:image\/(?:jpeg|png|webp);base64,/i.test(
      dataUrl
    )
  ) {
    return false;
  }

  if (dataUrl.length > 3_000_000) {
    return false;
  }

  return true;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!requireSameOrigin(req)) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid request origin.',
    },
    {
      status: 403,
    }
  );
}
  try {
    const auth = await getAuthedUserAndTenant();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const role =
      typeof body.role === "string" && body.role.trim()
        ? body.role.trim()
        : "staff";

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    const products = Array.isArray(body.products) ? body.products : [];

    if (products.length > 12) {
  return NextResponse.json(
    {
      ok: false,
      error: "Too many attachments.",
    },
    { status: 400 }
  );
}

if (!products.every(validateMessageImage)) {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Images must be JPG, PNG, or WebP and smaller than 2 MB.",
    },
    { status: 400 }
  );
}

    const saveAsInternalNote = body.saveAsInternalNote === true;
    const isAssistantCoachingRequest =
     body.isAssistantCoaching === true;

const assistantName =
  typeof body.assistantName === "string" && body.assistantName.trim()
    ? body.assistantName.trim().slice(0, 80)
    : "Store Assistant";

    if (!content && products.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Message content or product required" },
        { status: 400 }
      );
    }

    const convo = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: auth.tenant.id,
      },
      select: {
  id: true,
  aiEnabled: true,
  status: true,
},
    });

    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

const finalRole =
  role === "note"
    ? "note"
    : "staff";

const isAssistantCoaching =
  finalRole === "note" && isAssistantCoachingRequest;

if (isAssistantCoaching) {
  const entitlement = await getTenantEntitlement(
    auth.tenant.id
  );

  if (!entitlement.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: "TRIAL_EXPIRED",
        error: TRIAL_PAUSED_MERCHANT_MESSAGE,
      },
      { status: 402 }
    );
  }
}

let message = null;
let assistantNotedMessage = null;

if (!isAssistantCoaching || saveAsInternalNote) {
  message = await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: finalRole,
      content,
      productsJson: products.length > 0 ? JSON.stringify(products) : null,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });
}

if (isAssistantCoaching) {
  const guidance = content.trim();

  const coachingResult = await saveAssistantCoaching({
    tenantId: auth.tenant.id,
    conversationId: convo.id,
    guidance,
    assistantName,
  });

  assistantNotedMessage = await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: "note",
      content: coachingResult.reply,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });
}

await prisma.conversation.update({
  where: { id: convo.id },
  data: {
    lastMessageAt: new Date(),
    lastSeenAt: new Date(),
    needsHuman: finalRole === "staff" ? false : undefined,

    aiEnabled: finalRole === "staff" ? false : undefined,
    status: finalRole === "staff" && convo.status !== "closed" ? "waiting" : undefined,
  },
});

return NextResponse.json({
  ok: true,
  message: message
    ? {
        ...message,
        products,
      }
    : null,
  assistantNotedMessage,
});
  } catch (error) {
    console.error("POST /api/conversations/[id]/message failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}