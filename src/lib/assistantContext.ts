// src/lib/assistantContext.ts

import { prisma } from "@/lib/prisma";

export type AssistantIdentity = {
  name: string;
};

const PRODUCT_KNOWLEDGE_MARKER =
  "TIKOZAP_PRODUCT_KNOWLEDGE_V1";

function formatKnowledgeContent(
  title: string,
  content: string
): string {
  const trimmed = String(content || "").trim();

  if (!trimmed) return "";

  if (title !== "Product Knowledge") {
    return `## ${title}\n${trimmed}`;
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (
      parsed?.type === PRODUCT_KNOWLEDGE_MARKER &&
      Array.isArray(parsed?.rows)
    ) {
      const rows = parsed.rows
        .map((row: any) => {
          const product =
            typeof row?.product === "string"
              ? row.product.trim()
              : "";

          const notes =
            typeof row?.notes === "string"
              ? row.notes.trim()
              : "";

          if (!product && !notes) return "";

          return [
            product ? `Product: ${product}` : "",
            notes ? `Assistant notes: ${notes}` : "",
          ]
            .filter(Boolean)
            .join("\n");
        })
        .filter(Boolean);

      if (rows.length > 0) {
        return `## Product Knowledge\n${rows.join("\n\n")}`;
      }
    }
  } catch {
    // Preserve older plain-text Product Knowledge.
  }

  return `## Product Knowledge\n${trimmed}`;
}

export async function getAssistantIdentity(
  tenantId: string
): Promise<AssistantIdentity> {
  const widget = await prisma.widget.findUnique({
    where: {
      tenantId,
    },
    select: {
      assistantName: true,
      tenant: {
        select: {
          settingsJson: true,
        },
      },
    },
  });

  let tenantSettings: Record<string, string> = {};

  try {
    tenantSettings = widget?.tenant?.settingsJson
      ? JSON.parse(widget.tenant.settingsJson)
      : {};
  } catch {
    tenantSettings = {};
  }

  const name =
    tenantSettings.tz_assistant_name?.trim() ||
    widget?.assistantName?.trim() ||
    "Store Assistant";

  return {
    name,
  };
}

export async function getStoreKnowledge(
  tenantId: string,
  assistantName?: string | null
) {
  const [tenant, docs] = await Promise.all([
    prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        storeName: true,
      },
    }),

    prisma.knowledgeDoc.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
      select: {
        title: true,
        content: true,
      },
    }),
  ]);

  const identity = [
    "## Store Identity",
    `Store name: ${tenant?.storeName || "This store"}`,
    `Assistant name: ${assistantName?.trim() || "Store Assistant"}`,
    "You work for this store.",
    "Treat this store name and assistant identity as authoritative.",
    "Never say that you do not know the store name when it is provided here.",
  ].join("\n");

  const knowledge = docs
    .map((doc) =>
      formatKnowledgeContent(doc.title, doc.content)
    )
    .filter(Boolean)
    .join("\n\n");

  return [identity, knowledge]
    .filter(Boolean)
    .join("\n\n");
}

export async function getAssistantLearning(
  tenantId: string
) {
  const items = await prisma.assistantLearning.findMany({
    where: {
      tenantId,
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
    select: {
      instruction: true,
      createdAt: true,
    },
  });

  if (!items.length) return "";

  function getCoachingConflictKey(instruction: string): string | null {
    const text = instruction.toLowerCase();

    if (
      /\b(return|returns|refund|refunds)\b/.test(text) &&
      /\b(day|days|week|weeks|month|months|window|policy)\b/.test(text)
    ) {
      return "return_policy";
    }

    if (
      /\b(free shipping|shipping threshold|minimum order|order minimum)\b/.test(
        text
      )
    ) {
      return "shipping_threshold";
    }

    if (
      /\b(price|pricing|cost)\b/.test(text) &&
      /\b(mention|discuss|show|tell|ask|asked)\b/.test(text)
    ) {
      return "price_discussion_behavior";
    }

    if (
      /\b(recommend|recommendation|suggest|suggestion|prioritize|prefer)\b/.test(
        text
      )
    ) {
      return "recommendation_behavior";
    }

    if (
      /\b(escalate|take over|human|manager|support team|ask for help)\b/.test(
        text
      )
    ) {
      return "escalation_behavior";
    }

    return null;
  }

  const seenConflictKeys = new Set<string>();

  const currentItems = items.filter((item) => {
    const instruction = item.instruction.trim();
    const key = getCoachingConflictKey(instruction);

    if (!key) {
      return true;
    }

    if (seenConflictKeys.has(key)) {
      return false;
    }

    seenConflictKeys.add(key);
    return true;
  });

  return [
    "## Current Merchant Coaching",
    "",
    "These are the merchant's current active coaching instructions.",
    "They have already been ordered and filtered so newer clear conflicts replace older ones.",
    "",
    ...currentItems.map(
      (item, index) => `${index + 1}. ${item.instruction.trim()}`
    ),
  ].join("\n");
}