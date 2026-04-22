// src/lib/brain/classifyIntent.ts
import type { IntentType, UserTurnInput } from "./types";

export function classifyIntent(input: UserTurnInput): IntentType {
  const text = (input.text || "").toLowerCase().trim();
  const hasImage = !!input.images?.length;

  if (!text && hasImage) return "product_search";

  if (
    text.includes("do you have") ||
    text.includes("something like this") ||
    text.includes("find") ||
    text.includes("show me") ||
    text.includes("looking for") ||
    text.includes("search") ||
    text.includes("buy") ||
    text.includes("shop") ||
    text.includes("under $") ||
    text.includes("under ") ||
    text.includes("in black") ||
    text.includes("in blue") ||
    text.includes("snowboard") ||
    text.includes("dress") ||
    text.includes("shoes") ||
    text.includes("bag") ||
    text.includes("jacket")
  ) {
    return "product_search";
  }

  if (
    text.includes("is this good for") ||
    text.includes("would this work") ||
    text.includes("formal enough") ||
    text.includes("what do you think")
  ) {
    return "product_advice";
  }

  if (
    text.includes("shipping") ||
    text.includes("return") ||
    text.includes("refund") ||
    text.includes("delivery") ||
    text.includes("size guide")
  ) {
    return "store_question";
  }

  if (text) return "general_chat";

  return "unknown";
}