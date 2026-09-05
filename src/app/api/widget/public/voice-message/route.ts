// src/app/api/widget/public/voice-message/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractRequestHost, isAllowedDomain } from "@/lib/widgetDomain";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rateLimit";
import { canCreateConversationForTenant } from "@/lib/billingUsage";
import { incrementVoiceUsage } from "@/lib/voiceUsage";
import { wantsHuman } from "@/lib/handoffIntent";
import {
  getTenantEntitlement,
  TRIAL_PAUSED_VISITOR_MESSAGE,
} from "@/lib/tenantEntitlement";

export const runtime = "nodejs";

function clean(input: unknown) {
  return String(input || "").trim();
}

export async function POST(req: Request) {

  const rl = checkRateLimit(req, {
    namespace: "widget-public-voice-message",
    limit: 30,
    windowMs: 60_000,
  });

  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many voice updates. Please try again shortly." },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rl),
          "cache-control": "no-store",
        },
      }
    );
  }

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
    select: {
  tenantId: true,
  allowedDomains: true,
},
  });

  if (!widget) {
    return NextResponse.json(
      { ok: false, error: "Widget not found." },
      { status: 404 }
    );
  }

  const requestHost = extractRequestHost(req);

  if (!isAllowedDomain(requestHost, widget.allowedDomains || [])) {
    return NextResponse.json(
      { ok: false, error: "Widget is not allowed on this domain" },
      { status: 403 }
    );
  }

const entitlement = await getTenantEntitlement(widget.tenantId);

if (!entitlement.ok) {
  return NextResponse.json(
    {
      ok: false,
      reason: "TRIAL_EXPIRED",
      error: TRIAL_PAUSED_VISITOR_MESSAGE,
    },
    {
      status: 402,
    }
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
    const billing = await canCreateConversationForTenant(widget.tenantId);

if (!billing.ok) {
  return NextResponse.json(
{
  ok: false,
  error:
    billing.reason === "TRIAL_EXPIRED"
      ? TRIAL_PAUSED_VISITOR_MESSAGE
      : "This store has reached its monthly conversation limit.",
},
    {
      status: 402,
    }
  );
}

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
    source: "voice",
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
    source: "voice",
    createdAt: new Date(now + 10),
  },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    const shouldAlertHuman = wantsHuman(customerContent);

    await prisma.conversation.update({
      where: { id: convo.id },
      data: {
        lastMessageAt: new Date(now + 10),
        archivedAt: null,
        status: shouldAlertHuman ? "waiting" : undefined,
        needsHuman: shouldAlertHuman ? true : undefined,
      },
    });

const voiceUsageResult = await incrementVoiceUsage(widget.tenantId, 1);

if (!voiceUsageResult.ok) {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Daily free voice limit reached. Please continue chatting by text, or try voice again tomorrow.',
      reason: voiceUsageResult.reason,
      conversationId: convo.id,
    },
    { status: 402 }
  );
}

    return NextResponse.json({
      ok: true,
      conversationId: convo.id,
      messageId: assistantMessage.id,
      customerMessageId: customerMessage.id,
    });
  }
  let savedMessage;

  if (messageId) {
    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: convo.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingMessage) {
      return NextResponse.json(
        {
          ok: false,
          error: "Message not found.",
        },
        { status: 404 }
      );
    }

    savedMessage = await prisma.message.update({
      where: {
        id: existingMessage.id,
      },
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