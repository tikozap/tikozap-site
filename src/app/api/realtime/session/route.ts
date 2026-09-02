// src/app/api/realtime/session/route.ts

import { NextResponse } from "next/server";
import { HUMAN_HANDOFF_BEHAVIOR } from "@/lib/assistantBehavior";
import { buildTikoMarketingInstructions } from "@/lib/buildTikoMarketingInstructions";
import { getTikoLearning } from '@/lib/tikoLearningContext';
import { prisma } from "@/lib/prisma";
import { getTenantVoiceUsage } from "@/lib/voiceUsage";
import { requireSameOrigin } from "@/lib/security/requireSameOrigin";
import {
  getTenantEntitlement,
  TRIAL_PAUSED_VISITOR_MESSAGE,
} from "@/lib/tenantEntitlement";

import {
  getAssistantIdentity,
  getAssistantLearning,
  getStoreKnowledge,
} from "@/lib/assistantContext";

import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/lib/rateLimit";

import {
  extractRequestHost,
  isAllowedDomain,
} from "@/lib/widgetDomain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rate = checkRateLimit(req, {
    namespace: "realtime-session",
    limit: 12,
    windowMs: 60_000,
  });

  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many Voice session requests. Please try again shortly.",
      },
      {
        status: 429,
        headers: rateLimitHeaders(rate),
      }
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Voice service is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const mode =
      body?.mode === "marketing"
        ? "marketing"
        : "merchant";

   if (mode === "marketing" && !requireSameOrigin(req)) {
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

    const publicKey = String(
      body?.publicKey || ""
    ).trim();

    let merchantTenantId = "";

    const assistantIdentity = String(
      body?.assistantIdentity || "Female"
    );

    /*
     * Marketing/demo Voice is separate from merchant
     * Voice. Merchant Voice must always identify its
     * tenant before we create a paid OpenAI session.
     */
    if (mode === "merchant") {
      if (!publicKey) {
        return NextResponse.json(
          {
            ok: false,
            error: "Missing widget public key.",
          },
          { status: 400 }
        );
      }

const widget =
  await prisma.widget.findUnique({
    where: {
      publicKey,
    },
    select: {
      tenantId: true,
      allowedDomains: true,
    },
  });

      if (!widget) {
        return NextResponse.json(
          {
            ok: false,
            error: "Widget not found.",
          },
          { status: 404 }
        );
      }

      const requestHost = extractRequestHost(req);

if (
  !isAllowedDomain(
    requestHost,
    widget.allowedDomains || []
  )
) {
  return NextResponse.json(
    {
      ok: false,
      error: "Widget is not allowed on this domain",
    },
    { status: 403 }
  );
}

      merchantTenantId = widget.tenantId;

const entitlement =
  await getTenantEntitlement(
    widget.tenantId
  );

if (!entitlement.ok) {
  return NextResponse.json(
    {
      ok: false,
      reason: "TRIAL_EXPIRED",
      error: TRIAL_PAUSED_VISITOR_MESSAGE,
    },
    {
      status: 402,
    }
  );
}

      const usage =
        await getTenantVoiceUsage(
          widget.tenantId
        );

      const hasFreeQuestionRemaining =
        usage.freeQuestionsRemainingToday > 0;

      const hasPaidVoiceRemaining =
        usage.enabled &&
        usage.limitMinutes > 0 &&
        usage.remainingMinutes > 0;

      if (
        !hasFreeQuestionRemaining &&
        !hasPaidVoiceRemaining
      ) {
return NextResponse.json(
  {
    ok: false,
    reason: "VOICE_LIMIT_REACHED",
    error:
      "Today’s free Voice limit has been reached. Please continue by text or try Voice again tomorrow.",
  },
  { status: 402 }
);
      }
    }

    const voice =
      assistantIdentity === "Male"
        ? "verse"
        : assistantIdentity === "Neutral"
          ? "alloy"
          : "marin";

let merchantAssistantName = "";
let merchantStoreKnowledge = "";
let merchantLearning = "";

if (mode === "merchant" && merchantTenantId) {
  const assistantIdentityData =
    await getAssistantIdentity(merchantTenantId);

  merchantAssistantName =
    assistantIdentityData.name;

  [
    merchantStoreKnowledge,
    merchantLearning,
  ] = await Promise.all([
    getStoreKnowledge(
      merchantTenantId,
      assistantIdentityData.name
    ),
    getAssistantLearning(merchantTenantId),
  ]);
}

const tikoLearning =
  mode === 'marketing'
    ? await getTikoLearning({
        target: 'tiko_web',
        channel: 'voice',
      })
    : '';
const baseInstructions =
  mode === "marketing"
    ? buildTikoMarketingInstructions(tikoLearning)
    : [
        `You are ${merchantAssistantName || "the store assistant"}, the AI customer support employee for this online store.`,

        "Speak calmly, clearly, honestly, and naturally.",
        "You represent the merchant's store, not TikoZap.",
        "Do not introduce yourself as Tiko unless the merchant explicitly chose that name.",
        "Your role is to welcome, guide, recommend, answer store questions, and help shoppers think through choices.",

        "Use the Store Knowledge and Assistant Current Understanding below when answering.",
        "The Assistant Current Understanding contains the merchant's resolved coaching and should take priority over older conflicting store guidance.",

        HUMAN_HANDOFF_BEHAVIOR,

        merchantStoreKnowledge,

        merchantLearning,

        "VOICE PRODUCT HANDOFF:",
        "Do not perform live product search, inventory lookup, exact catalog price lookup, or filtered product retrieval yourself.",
        "Do not pretend that you are searching products or checking live inventory.",
        "When the shopper wants exact products, current prices, availability, pictures, product cards, comparisons, or filtered recommendations, smoothly suggest continuing in text chat because text can show the actual product cards and visual details more clearly.",
        "Present this as a helpful transition, not as a limitation.",
        "For example: I can show you the actual product cards in chat so they're easier to compare. Let's continue there.",
        "Do not repeatedly explain the technical reason or mention system limitations.",
        "Always ask for the shopper's permission before switching to text.",
        "Do not say that you are switching, moving, or continuing in text until the shopper clearly agrees.",
        "Use natural wording such as: I have a better way to help you. I can show you the actual product images and options in chat so they're easier to compare. Would you like me to switch us over?",
        "If the shopper declines, stay in Voice and continue helping conversationally.",
        "If the shopper agrees, briefly acknowledge the choice, for example: Great, I'll switch us over.",
        "Present the transition as a better way to help, not as a technical limitation.",

        "Keep spoken answers concise and conversational.",
        "Ignore background noise, breathing, coughs, mic bumps, TV or radio sound, and side conversations not directed at you.",
        "Only respond when the shopper is clearly speaking to the assistant with a meaningful question or request.",
        "If the input is unclear, too short, or sounds accidental, stay silent when possible. If a response is required, briefly say: I didn't catch that.",
      ]
        .filter(Boolean)
        .join("\n\n");

const voiceLanguageInstructions = [
  "For Voice conversations, default to English.",
  "Always make the first spoken response in English unless the shopper clearly begins speaking another language.",
  "Do not infer French or any other language from a short, unclear, noisy, or ambiguous utterance.",
  "If the shopper clearly speaks another language, naturally continue in that language.",
  "If the language is uncertain, remain in English.",
].join(" ");

const instructions = [
  baseInstructions,
  voiceLanguageInstructions,
].join(" ");

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          expires_after: {
            anchor: "created_at",
            seconds: 600,
          },

          session: {
            type: "realtime",
            model:
              process.env
                .OPENAI_REALTIME_MODEL ||
              "gpt-realtime",
            instructions,

            audio: {
              input: {
                format: {
                  type: "audio/pcm",
                  rate: 24000,
                },

                noise_reduction: {
                  type: "far_field",
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
  language: "en",
  prompt:
    "The speaker is expected to begin in English. Transcribe short or ambiguous opening phrases as English unless another language is clearly spoken.",
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

    const rawText =
      await response.text();

    let data: any = null;

    try {
      data = rawText
        ? JSON.parse(rawText)
        : null;
    } catch {
      data = {
        raw: rawText,
      };
    }

if (!response.ok) {
console.error(
  "[realtime/session] OpenAI session creation failed",
  {
    status: response.status,
    statusText: response.statusText,
  }
);

  return NextResponse.json(
    {
      ok: false,
      error: "Failed to create realtime voice session.",
    },
    {
      status: response.status,
    }
  );
}

if (!data?.value) {
console.error(
  "[realtime/session] Invalid realtime service response"
);
  return NextResponse.json(
    {
      ok: false,
      error: "Voice service is temporarily unavailable.",
    },
    { status: 500 }
  );
}

    return NextResponse.json({
      ok: true,

      client_secret: {
        value: data.value,
        expires_at:
          data.expires_at ?? null,
      },

      expires_at:
        data.expires_at ?? null,

      model:
        data?.session?.model ?? null,

      session:
        data?.session ?? null,
    });
  } catch (error: any) {
    console.error(
      "[realtime/session]",
      error
    );

return NextResponse.json(
  {
    ok: false,
    error: "Voice service is temporarily unavailable.",
  },
  { status: 500 }
);
  }
}