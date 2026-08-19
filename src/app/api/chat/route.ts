// src/app/api/chat/route.ts

export const runtime = "nodejs";

import { wantsHuman } from "@/lib/handoffIntent";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { runTikoBrain } from "@/lib/brain";
import { getTikoLearning } from '@/lib/tikoLearningContext';
import { resolveProductProvider } from "@/lib/resolveProductProvider";
import {
  getAssistantIdentity,
  getAssistantLearning,
  getStoreKnowledge,
} from "@/lib/assistantContext";
import { buildTikoMarketingInstructions } from "@/lib/buildTikoMarketingInstructions";
import {
  getTenantEntitlement,
  TRIAL_PAUSED_VISITOR_MESSAGE,
} from "@/lib/tenantEntitlement";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/rateLimit";

type ChatBody = {
  message?: string;
  conversationId?: string | null;
  image?: string | null;
  publicKey?: string | null;
  channel?: string | null;
  mode?: "marketing" | "merchant";
  tags?: string[] | null;
  visitor?: {
    name?: string | null;
  } | null;
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

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) return "";
  return tags
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .join(",");
}

const HUMAN_HANDOFF_REPLY =
  "I’ve notified the store team and left a message for them.\n\n" +
  "They’ll review this conversation and get back to you as soon as possible.\n\n" +
  "While you wait, I’m still here if you’d like help with order status, shipping, returns, or product questions.";

const HUMAN_FOLLOWUP_REPLIES = [
  "I understand this is urgent. The store team has already been notified, and I’ll keep helping while we wait.\n\nCan you tell me what happened so I can try to help right now?",
  "I hear you. The team has already been alerted, and I won’t ignore your request for a person.\n\nWhile we’re waiting, tell me what you need help with and I’ll do my best.",
  "I understand you want human help. The store team has already been notified.\n\nIn the meantime, I’m still here with you — what’s the main issue we should work on first?",
];

function pickHumanFollowupReply() {
  return HUMAN_FOLLOWUP_REPLIES[
    Math.floor(Math.random() * HUMAN_FOLLOWUP_REPLIES.length)
  ];
}

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(req, {
      namespace: "public-chat",
      limit: 20,
      windowMs: 60_000,
    });

    if (!rl.ok) {
      return NextResponse.json(
        {
          error:
            "Too many messages. Please wait a moment and try again.",
        },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(rl),
            "cache-control": "no-store",
          },
        }
      );
    }

    const body = (await req.json()) as ChatBody;
    const mode =
  body.mode === "marketing"
    ? "marketing"
    : "merchant";

    const message = normalizeText(body.message);
    const publicKey = normalizeText(
  body.publicKey || (body as any).key
);
    const rawConversationId = normalizeText(body.conversationId);
const clientConversationId = rawConversationId.startsWith("conv_")
  ? ""
  : rawConversationId;
    const channel = normalizeText(body.channel) || "starter-link";
    const customerName =
      normalizeText(body.visitor?.name) || "Website visitor";
    const tags = normalizeTags(body.tags);

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    if (!message) {
  return NextResponse.json(
    { error: "Missing message" },
    { status: 400 }
  );
}
    if (message.length > 4000) {
  return NextResponse.json(
    { error: "Message is too long." },
    { status: 400 }
  );
}

if (mode === "marketing") {
  const client = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

  if (!client) {
    return NextResponse.json(
      {
        error: "Tiko is temporarily unavailable.",
      },
      { status: 503 }
    );
  }

  const tikoLearning = await getTikoLearning();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: buildTikoMarketingInstructions(tikoLearning),
      },
      {
        role: "user",
        content: message,
      },
    ],
    max_output_tokens: 500,
  });

  const answer =
    response.output_text?.trim() ||
    "I’m Tiko, TikoZap’s product representative. What would you like to know about TikoZap?";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          streamSSE({
            type: "meta",
            conversationId: "tiko-marketing",
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

        await new Promise((resolve) =>
          setTimeout(resolve, 35)
        );
      }

      controller.enqueue(
        new TextEncoder().encode(
          streamSSE({
            type: "final",
            conversationId: "tiko-marketing",
            remaining: 999,
            dailyLimit: 999,
            userType: "anonymous",
            products: [],
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
}

const shouldAlertHuman = wantsHuman(message);

let answer = "";
let products: any[] = [];

    // REAL PRISMA PATH
const widget = await prisma.widget.findFirst({
  where: {
    publicKey,
  },
  select: {
    tenantId: true,
  },
});

const resolvedWidget = widget;

if (!resolvedWidget) {
  return NextResponse.json(
    {
      error: "Invalid widget key",
    },
    { status: 404 }
  );
}

const entitlement = await getTenantEntitlement(
  resolvedWidget.tenantId
);

if (!entitlement.ok) {
  return NextResponse.json(
    {
      error: TRIAL_PAUSED_VISITOR_MESSAGE,
      reason: "TRIAL_EXPIRED",
    },
    { status: 402 }
  );
}

const assistantIdentity = await getAssistantIdentity(
  resolvedWidget.tenantId
);

const resolvedAssistantName = assistantIdentity.name;

    let conversation =
      clientConversationId
        ? await prisma.conversation.findFirst({
            where: {
              id: clientConversationId,
              tenantId: resolvedWidget.tenantId,
            },
          select: {
  id: true,
  aiEnabled: true,
  needsHuman: true,
},
          })
        : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId: resolvedWidget.tenantId,
          channel,
          status: "open",
          aiEnabled: true,
          customerName,
          subject: channel === "starter-link" ? "Starter Link" : "Website chat",
          tags,
          needsHuman: false,
        },
        select: {
  id: true,
  aiEnabled: true,
  needsHuman: true,
},
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "customer",
        content: message,
      },
    });
if (!conversation.aiEnabled && !shouldAlertHuman) {
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      status: "waiting",
    },
  });

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

      controller.enqueue(
        new TextEncoder().encode(
          streamSSE({
            type: "final",
            conversationId: conversation.id,
            remaining: 999,
            dailyLimit: 999,
            userType: "anonymous",
            products: [],
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
}

if (shouldAlertHuman) {
  answer = conversation.needsHuman
    ? pickHumanFollowupReply()
    : HUMAN_HANDOFF_REPLY;
  products = [];
} else {
const recentMessagesDescending = await prisma.message.findMany({
  where: {
    conversationId: conversation.id,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 12,
  select: {
    role: true,
    content: true,
  },
});

const recentMessages = recentMessagesDescending.reverse();

const storeKnowledge = await getStoreKnowledge(
  resolvedWidget.tenantId,
  resolvedAssistantName
);

const assistantLearning = await getAssistantLearning(
  resolvedWidget.tenantId
);

const productProvider = await resolveProductProvider(
  resolvedWidget.tenantId
);

const brain = await runTikoBrain({
  message,
  history: recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
  storeKnowledge,
  assistantLearning,
  productProvider,
});

  answer = brain.reply;
  products = brain.products;
}

await prisma.message.create({
  data: {
    conversationId: conversation.id,
    role: "assistant",
    content: answer,
    productsJson:
      products && products.length > 0
        ? JSON.stringify(products)
        : null,
  },
});

await prisma.conversation.update({
  where: { id: conversation.id },
  data: {
    lastMessageAt: new Date(),
    needsHuman: shouldAlertHuman ? true : undefined,
    status: shouldAlertHuman ? "waiting" : "open",
  },
});

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
    if (process.env.NODE_ENV === "production") {
  console.error("CHAT_ROUTE_FATAL");
} else {
  console.error("CHAT_ROUTE_FATAL", error);
}

return NextResponse.json(
  {
    error: "Chat service is temporarily unavailable.",
  },
  { status: 500 }
);
  }
}