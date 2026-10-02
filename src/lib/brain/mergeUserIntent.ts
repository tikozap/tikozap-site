// src/lib/brain/mergeUserIntent.ts

import { classifyIntent } from "./classifyIntent";
import type { MergedIntent, UserTurnInput, VisionContext } from "./types";

function extractMaxPrice(text: string): number | undefined {
  const between = text.match(/between\s*\$?\s*(\d+)\s*and\s*\$?\s*(\d+)/i);
  if (between) {
    return Number(between[2]);
  }

  const match = text.match(/(?:under|below|less than)\s*\$?\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function extractMinPrice(text: string): number | undefined {
  const between = text.match(/between\s*\$?\s*(\d+)\s*and\s*\$?\s*(\d+)/i);
  if (between) {
    return Number(between[1]);
  }

  const match = text.match(/(?:over|above|more than)\s*\$?\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function extractColor(text: string): string | undefined {
  const colors = [
    "black",
    "white",
    "blue",
    "red",
    "green",
    "beige",
    "brown",
    "pink",
    "gray",
    "grey",
    "navy",
    "purple",
    "yellow",
  ];

  const lower = text.toLowerCase();
  return colors.find((c: any) => lower.includes(c));
}

function extractStyle(text: string): string | undefined {
  const styles = [
    "freestyle",
    "all-mountain",
    "all mountain",
    "powder",
    "beginner",
    "advanced",
    "park",
    "carving",
    "minimal",
  ];

  const lower = text.toLowerCase();
  const found = styles.find((s: any) => lower.includes(s));
  if (!found) return undefined;
  return found === "all mountain" ? "all-mountain" : found;
}

export function mergeUserIntent(
  input: UserTurnInput,
  visionContext: VisionContext | null
): MergedIntent {
  const text = (input.text || "").trim();
  const classified = classifyIntent(input);

  const priceMax = extractMaxPrice(text);
  const priceMin = extractMinPrice(text);
  const textColor = extractColor(text);
  const textStyle = extractStyle(text);

  const category = visionContext?.category;
  const color = textColor || visionContext?.color;
  const style = textStyle || visionContext?.style;

  const keywords = [
    ...(visionContext?.keywords || []),
    ...(text ? text.split(/\s+/).filter(Boolean) : []),
  ];

  const dedupedKeywords = Array.from(
    new Set(
      keywords
        .map((k: any) => k.toLowerCase().replace(/[^\w-]/g, ""))
        .filter(Boolean)
    )
  ).slice(0, 24);

  return {
    type: classified,
    userGoal: text || "User wants help based on the uploaded image.",
    wantsProductSearch:
      classified === "product_search" || (!!input.images?.length && !text),
    wantsAdvice: classified === "product_advice",
    priceMax,
    priceMin,
    color,
    category,
    style,
    keywords: dedupedKeywords,
  };
}