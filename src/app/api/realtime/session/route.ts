// src/app/api/realtime/session/route.ts

import { NextResponse } from "next/server";
import { buildTikoMarketingInstructions } from "@/lib/buildTikoMarketingInstructions";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing OPENAI_API_KEY",
        },
        { status: 500 }
      );
    }

const body = await req.json().catch(() => ({}));

const mode =
  body?.mode === "marketing"
    ? "marketing"
    : "merchant";

const assistantIdentity = String(
  body?.assistantIdentity || "Female"
);

    const voice =
      assistantIdentity === "Male"
        ? "verse"
        : assistantIdentity === "Neutral"
          ? "alloy"
          : "marin";

const instructions =
  mode === "marketing"
    ? buildTikoMarketingInstructions()
    : [
        "You are the AI customer support employee for an online store.",
        "Speak calmly, clearly, honestly, and naturally.",
        "You represent the merchant's store, not TikoZap.",
        "Do not introduce yourself as Tiko unless the merchant explicitly chose that name.",
        "Your role is to welcome, guide, recommend, and help shoppers think through choices.",
        "Do not perform product search, inventory lookup, or price lookup yourself.",
        "Do not say you are checking the store, pulling products, or looking up inventory.",
        "If the shopper wants exact products, prices, filters, or availability, tell them to use chat.",
        "Keep answers concise and helpful.",
        "Communicate in the shopper's preferred language whenever you can confidently do so. If the shopper changes languages, naturally switch with them. Keep each response in one language unless requested otherwise. Never claim that you can only communicate in one language.",
        "Ignore background noise, breathing, coughs, mic bumps, TV or radio sound, and side conversations not directed at you.",
        "Only respond when the shopper is clearly speaking to the assistant with a meaningful question or request.",
        "If the input is unclear, too short, or sounds accidental, stay silent when possible. If a response is required, briefly say: I didn't catch that.",
      ].join(" ");
console.log("[realtime/session mode]", {
  requestedMode: body?.mode,
  resolvedMode: mode,
  instructionsStart: instructions.slice(0, 180),
});

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expires_after: {
            anchor: "created_at",
            seconds: 600,
          },
session: {
  type: "realtime",
  model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
  instructions,

            audio: {
              input: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.8,
                  prefix_padding_ms: 250,
                  silence_duration_ms: 1200,
                  create_response: true,
                  interrupt_response: false,
                },
                transcription: {
                  model: "gpt-4o-mini-transcribe",
                },
              },
              output: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
                voice,
                speed: 1,
              },
            },
          },
        }),
      }
    );

    const rawText = await response.text();
    let data: any = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = { raw: rawText };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.message ||
            data?.message ||
            "Failed to create realtime voice session.",
          debug: data,
        },
        { status: response.status }
      );
    }

    if (!data?.value) {
      return NextResponse.json(
        {
          ok: false,
          error: "OpenAI response missing secret value",
          debug: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      client_secret: {
        value: data.value,
        expires_at: data.expires_at ?? null,
      },
      expires_at: data.expires_at ?? null,
      model: data?.session?.model ?? null,
      session: data?.session ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Realtime session route failed",
        detail: error?.message ?? "Unknown server error",
      },
      { status: 500 }
    );
  }
}