// src/lib/assistantContext.ts

import { prisma } from "@/lib/prisma";
import { buildCurrentUnderstanding } from '@/lib/buildCurrentUnderstanding';

export type AssistantIdentity = {
  name: string;
};

const PRODUCT_KNOWLEDGE_MARKER =
  "TIKOZAP_PRODUCT_KNOWLEDGE_V1";

const MAX_STORE_KNOWLEDGE_CONTEXT = 60_000;

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
        websiteUrl: true,
        settingsJson: true,
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

  let settings: Record<string, unknown> = {};

  try {
    settings = tenant?.settingsJson
      ? JSON.parse(tenant.settingsJson)
      : {};
  } catch {
    settings = {};
  }

  const category =
    typeof settings.category === "string"
      ? settings.category.trim()
      : "";

  const supportEmail =
    typeof settings.supportEmail === "string"
      ? settings.supportEmail.trim()
      : "";

  const businessHours =
    typeof settings.businessHours === "string"
      ? settings.businessHours.trim()
      : "";

  const websiteUrl = tenant?.websiteUrl?.trim() || "";

  const profileLines = [
    "## Store Profile",
    `Store name: ${tenant?.storeName || "This store"}`,
    `Assistant name: ${assistantName?.trim() || "Store Assistant"}`,
    category ? `Primary category: ${category}` : "",
    websiteUrl ? `Store website: ${websiteUrl}` : "",
    supportEmail ? `Support email: ${supportEmail}` : "",
    businessHours ? `Business hours: ${businessHours}` : "",
    "",
    "You work for this store.",
    "Treat these configured store profile facts as authoritative.",
    "Use them naturally when customers ask about the store.",
    "Do not claim that a configured fact is unknown when it is provided here.",
  ].filter(Boolean);

const formattedKnowledge = docs
  .map((doc) =>
    formatKnowledgeContent(doc.title, doc.content)
  )
  .filter(Boolean);

let knowledge = "";

for (const item of formattedKnowledge) {
  const separator = knowledge ? "\n\n" : "";

  const remaining =
    MAX_STORE_KNOWLEDGE_CONTEXT -
    knowledge.length -
    separator.length;

  if (remaining <= 0) break;

  knowledge +=
    separator +
    item.slice(0, remaining);
}

  return [
    profileLines.join("\n"),
    knowledge,
  ]
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
      updatedAt: "desc",
    },
    take: 50,
    select: {
      instruction: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!items.length) return "";

  const currentUnderstanding =
    await buildCurrentUnderstanding(items);

  return [
    "## Assistant Current Understanding",
    "",
    "This is the assistant's resolved current understanding from the merchant's complete coaching history.",
    "Conflicting historical coaching has already been resolved using semantic meaning and recency.",
    "Treat this current understanding as authoritative over older conflicting merchant coaching.",
    "",
    currentUnderstanding,
  ].join("\n");
}