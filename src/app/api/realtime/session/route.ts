// src/app/api/realtime/session/route.ts

import { NextResponse } from "next/server";

export async function POST() {
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
            instructions: [
              "You are tikozap.ai.",
              "Speak calmly, clearly, honestly, and naturally.",
              "You are a voice concierge for an online store.",
              "Your role is to welcome, guide, recommend, and help shoppers think through choices.",
              "Do not perform product search, inventory lookup, or price lookup yourself.",
              "Do not say you are checking the store, pulling products, or looking up inventory.",
              "If the shopper wants exact products, prices, filters, or availability, tell them to use chat and tap 'Show in chat'.",
              "Keep answers concise, but when the user asks about features, value, or how the product works, give a fuller spoken explanation.",
              "If the user asks a broad question, you may answer in multiple sentences and continue naturally until the explanation is complete.",
              "Always reply in English unless the user clearly switches to another language.",
              "If the input is only noise, breathing, cough, mic bump, silence, or meaningless sound, do not answer contentfully.",
              "If the audio is unclear, briefly say: 'I didn't catch that.'",
            ].join(" "),
            audio: {
              input: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.85,
                  prefix_padding_ms: 400,
                  silence_duration_ms: 1200,
                  create_response: true,
                  interrupt_response: false,
                },
                transcription: {
                  model: "gpt-4o-mini-transcribe",
                  language: "en",
                },
              },
              output: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },
                voice: "marin",
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