// src/lib/brain/evidence.ts

export type EvidencePriority =
  | "authoritative"
  | "high"
  | "normal";

export type EvidenceSource =
  | "live_product"
  | "merchant_coaching"
  | "store_knowledge";

export type EvidenceItem = {
  source: EvidenceSource;
  priority: EvidencePriority;
  title: string;
  content: string;
};

const PRIORITY_ORDER: Record<EvidencePriority, number> = {
  authoritative: 3,
  high: 2,
  normal: 1,
};

const SECTION_LABELS: Record<EvidenceSource, string> = {
  live_product: "AUTHORITATIVE LIVE PRODUCT FACTS",
  merchant_coaching: "HIGH PRIORITY MERCHANT COACHING",
  store_knowledge: "STORE KNOWLEDGE",
};

const SOURCE_ORDER: EvidenceSource[] = [
  "live_product",
  "merchant_coaching",
  "store_knowledge",
];

function cleanContent(value: string) {
  return String(value || "").trim();
}

export function formatEvidencePack(items: EvidenceItem[]): string {
  const cleanedItems = items
    .map((item) => ({
      ...item,
      title: cleanContent(item.title),
      content: cleanContent(item.content),
    }))
    .filter((item) => item.content.length > 0)
    .sort(
      (a, b) =>
        PRIORITY_ORDER[b.priority] -
        PRIORITY_ORDER[a.priority]
    );

  if (cleanedItems.length === 0) {
    return "No merchant-specific evidence is available for this question.";
  }

  const sections = SOURCE_ORDER.map((source) => {
    const sourceItems = cleanedItems.filter(
      (item) => item.source === source
    );

    if (sourceItems.length === 0) {
      return "";
    }

    const body = sourceItems
      .map((item) => {
        if (!item.title) {
          return item.content;
        }

        return `${item.title}:\n${item.content}`;
      })
      .join("\n\n");

    return `[${SECTION_LABELS[source]}]\n${body}`;
  }).filter(Boolean);

  return sections.join("\n\n");
}