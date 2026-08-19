// src/app/api/knowledge/extract/route.ts

import { NextResponse } from "next/server";

import { getAuthedUserAndTenant } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { requireSameOrigin } from "@/lib/security/requireSameOrigin";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/rateLimit";

export const runtime = "nodejs";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const PDF_TYPE = "application/pdf";

export async function POST(req: Request) {
  if (!requireSameOrigin(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request origin.",
      },
      {
        status: 403,
      }
    );
  }

  const auth = await getAuthedUserAndTenant();

  if (!auth?.tenant?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const rate = checkRateLimit(req, {
    namespace: "knowledge-extract",
    limit: 10,
    windowMs: 60_000,
  });

  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many file extraction requests. Please try again shortly.",
      },
      {
        status: 429,
        headers: rateLimitHeaders(rate),
      }
    );
  }

  try {
    const formData = await req.formData();
    const entry = formData.get("file");

    if (!(entry instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: "File is required.",
        },
        {
          status: 400,
        }
      );
    }

    const file = entry;
    const isPdf = file.type === PDF_TYPE;
    const isImage = IMAGE_TYPES.includes(file.type);

    if (!isPdf && !isImage) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please upload a PDF, JPG, PNG, or WebP file.",
        },
        {
          status: 400,
        }
      );
    }

    const maxBytes = isPdf
      ? 5 * 1024 * 1024
      : 3 * 1024 * 1024;

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: isPdf
            ? "PDF must be smaller than 5 MB."
            : "Image must be smaller than 3 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const base64 = buffer.toString("base64");

    const instruction = [
      "Extract useful merchant product knowledge from this reference.",
      "",
      "Focus on factual information a store assistant could use when helping customers, such as:",
      "- product names and variants",
      "- measurements and size charts",
      "- materials",
      "- care instructions",
      "- compatibility",
      "- warnings",
      "- warranty details",
      "- product specifications",
      "- usage instructions",
      "",
      "Preserve important numbers, units, labels, and exceptions.",
      "Do not invent missing information.",
      "Return concise plain text only.",
    ].join("\n");

    const response = isPdf
      ? await openai.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_file",
                  filename: file.name || "reference.pdf",
                  file_data: `data:application/pdf;base64,${base64}`,
                },
                {
                  type: "input_text",
                  text: instruction,
                },
              ],
            },
          ],
          max_output_tokens: 2500,
        })
      : await openai.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: instruction,
                },
                {
                  type: "input_image",
                  image_url: `data:${file.type};base64,${base64}`,
                  detail: "auto",
                },
              ],
            },
          ],
          max_output_tokens: 2500,
        });

    const text = response.output_text?.trim() || "";

    if (!text) {
      return NextResponse.json(
        {
          ok: false,
          error: "No readable product information was found.",
        },
        {
          status: 422,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      text,
    });
  } catch (error) {
    console.error(
      "[knowledge-extract] File extraction failed",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return NextResponse.json(
      {
        ok: false,
        error: "This file could not be processed.",
      },
      {
        status: 500,
      }
    );
  }
}