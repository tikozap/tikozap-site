// src/lib/brain/composeAnswer.ts
import type { MergedIntent, ProductSearchResult, VisionContext } from "./types";

type ComposeAnswerArgs = {
  text?: string;
  visionContext: VisionContext | null;
  mergedIntent: MergedIntent;
  products?: ProductSearchResult[];
};

export function composeAnswer({
  text,
  visionContext,
  mergedIntent,
  products = [],
}: ComposeAnswerArgs): string {
  const hasProducts = products.length > 0;

  if (mergedIntent.wantsProductSearch) {
    if (hasProducts) {
      return products.length === 1
        ? `I found a matching product from the store.`
        : `Here are some matching products from the store.`;
    }

    const description = [
      visionContext?.color,
      visionContext?.style,
      visionContext?.category,
    ]
      .filter(Boolean)
      .join(" ");

    if (description) {
      return `This looks like a ${description}. I couldn't find matching products in the store yet, but I can help refine the search by color, style, price, or occasion.`;
    }

    return `I couldn't find matching products in the store yet, but I can help refine the search by color, style, price, or occasion.`;
  }

  if (mergedIntent.wantsAdvice) {
    if (visionContext?.unclear) {
      return `I can help, but some image details are still unclear. Tell me the main thing you want judged, such as style, color, fit, or occasion.`;
    }

    return `From the image, this appears to be a ${[
      visionContext?.color,
      visionContext?.style,
      visionContext?.category,
    ]
      .filter(Boolean)
      .join(" ")}. Based on that, it seems reasonably aligned with your request.`;
  }

  if (text) {
    return `I understand your message${visionContext ? " and the uploaded image" : ""}.`;
  }

  return `I received your image and I’m ready to help.`;
}