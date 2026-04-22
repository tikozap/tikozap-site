// src/lib/brain/extractVisionContext.ts
import { openai } from "@/lib/openai";
import type { UserImageInput, VisionContext } from "./types";

type ExtractVisionArgs = {
  images: UserImageInput[];
  text?: string;
};

function toDataUrl(base64: string, mimeType?: string): string {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  return `data:${mimeType || "image/jpeg"};base64,${clean}`;
}

export async function extractVisionContext(
  args: ExtractVisionArgs
): Promise<VisionContext | null> {
  const img = args.images?.[0];
  if (!img?.base64) return null;

  try {
    const dataUrl = toDataUrl(img.base64, img.mimeType);

    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Analyze the image and return only JSON.",
                "",
                "Fields:",
                "- category",
                "- color",
                "- pattern",
                "- style",
                "- material",
                "- useCase",
                "- keywords (array of short strings)",
                "- confidence (0 to 1)",
                "- notes",
                "- unclear (boolean)",
                "",
                args.text
                  ? `User text for context: ${args.text}`
                  : "No additional user text provided.",
              ].join("\n"),
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "vision_context",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: { type: ["string", "null"] },
              color: { type: ["string", "null"] },
              pattern: { type: ["string", "null"] },
              style: { type: ["string", "null"] },
              material: { type: ["string", "null"] },
              useCase: { type: ["string", "null"] },
              keywords: {
                type: "array",
                items: { type: "string" },
              },
              confidence: { type: ["number", "null"] },
              notes: { type: ["string", "null"] },
              unclear: { type: "boolean" },
            },
            required: [
              "category",
              "color",
              "pattern",
              "style",
              "material",
              "useCase",
              "keywords",
              "confidence",
              "notes",
              "unclear",
            ],
          },
        },
      },
      temperature: 0.2,
    });

    const text = resp.output_text ?? "";
    const parsed = JSON.parse(text);

    return {
      category: parsed.category ?? undefined,
      color: parsed.color ?? undefined,
      pattern: parsed.pattern ?? undefined,
      style: parsed.style ?? undefined,
      material: parsed.material ?? undefined,
      useCase: parsed.useCase ?? undefined,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      notes: parsed.notes ?? undefined,
      unclear: !!parsed.unclear,
    };
  } catch (err) {
    console.error("VISION_ERROR", err);

    return {
      keywords: [],
      unclear: true,
      notes: "Vision error",
    };
  }
}