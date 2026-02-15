// src/app/api/widget/public/message/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const ALWAYS_ALLOWED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'app.tikozap.com',
  'link.tikozap.com',
  'tikozap.com',
]);

function normalizeHost(h: string) {
  const s = String(h || '').trim().toLowerCase();
  if (!s) return '';
  return s.startsWith('www.') ? s.slice(4) : s;
}

function hostFromUrlHeader(v: string | null) {
  if (!v) return '';
  try {
    const u = new URL(v);
    return normalizeHost(u.hostname);
  } catch {
    return '';
  }
}

function getOriginHost(req: Request) {
  // Prefer Origin; fallback Referer
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  return hostFromUrlHeader(origin) || hostFromUrlHeader(referer) || '';
}

function isHostAllowed(host: string, allowedDomains: string[]) {
  const h = normalizeHost(host);
  if (!h) return false;

  if (ALWAYS_ALLOWED_HOSTS.has(h)) return true;

  // exact / wildcard match against normalized allowlist
  for (const raw of allowedDomains || []) {
    const rule = String(raw || '').trim().toLowerCase();
    if (!rule) continue;

    if (rule.startsWith('*.')) {
      const suffix = rule.slice(1); // ".example.com"
      if (h.endsWith(suffix)) return true;
      continue;
    }

    const r = normalizeHost(rule);
    if (h === r) return true;
  }

  return false;
}

export const runtime = "nodejs";
const BUILD_MARK = "widget-public-message-2026-01-25a";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Debug endpoint to prove the route exists in prod
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: "/api/widget/public/message",
      now: new Date().toISOString(),
      build: "widget-public-message-2026-01-25a",
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      projectId: process.env.VERCEL_PROJECT_ID ?? null,
    },
    { headers: corsHeaders }
  );
}

const Body = z.object({
  key: z.string().min(8).max(200),
  text: z.string().min(1).max(4000),

  customerName: z.string().max(120).optional().nullable(),
  customerEmail: z.string().max(200).optional().nullable(),
  subject: z.string().max(160).optional().nullable(),
  channel: z.string().max(40).optional().nullable(),
  tags: z.string().max(300).optional().nullable(),
  aiEnabled: z.boolean().optional().nullable(),

  conversationId: z.string().optional().nullable(),
});

function paywallJson(params: {
  reason: string;
  plan?: string | null;
  billingStatus?: string | null;
  limitName?: string;
  limitValue?: number;
  currentValue?: number;
}) {
  return {
    ok: false,
    code: "PAYWALL",
    error: params.reason,
    plan: params.plan ?? null,
    billingStatus: params.billingStatus ?? null,
    limit: params.limitName
      ? {
          name: params.limitName,
          value: params.limitValue ?? null,
          current: params.currentValue ?? null,
        }
      : null,
  };
}

function assistantAutoReply(customerText: string, storeName: string) {
  const t = (customerText || "").toLowerCase();

  if (t.includes("return"))
    return `Returns are accepted within 30 days if items are unworn with tags. Want me to outline the return steps for ${storeName}?`;

  if (t.includes("ship") || t.includes("delivery"))
    return `Orders ship in 1–2 business days. Typical US delivery is 3–7 business days. What’s your ZIP code?`;

  if (t.includes("order") || t.includes("tracking"))
    return `I can help—please share your order number and the email used at checkout so I can check the status.`;

  if (t.includes("xl") || t.includes("size"))
    return `I can help with sizing. Which item are you looking at, and what size do you usually wear?`;

  return `Got it. Can you share a little more detail so I can help faster?`;
}

function isDateTimeQuestion(text: string) {
  const t = (text || "").toLowerCase().trim();
  if (!t) return false;

  // Common “date/day” phrasings
  if (t.includes("what date") && (t.includes("today") || t.includes("it"))) return true;
  if (t.includes("what day") && (t.includes("today") || t.includes("it"))) return true;
  if (t.includes("what day is it")) return true;
  if (t.includes("today's date") || t.includes("todays date")) return true;
  if (t.includes("today's day") || t.includes("todays day")) return true;

  // Month / year
  if (t.includes("what month") || t.includes("which month")) return true;
  if (t.includes("what year") || t.includes("which year")) return true;

  // Time
  if (t.includes("what time") || t.includes("current time") || t.includes("time now")) return true;

  // Explicit “system” wording
  if (t.includes("current date") || t.includes("date now")) return true;
  if (t.includes("date in your system") || t.includes("time in your system")) return true;

  return false;
}

function serverDateTimeReply(timeZone?: string | null) {
  const tz = timeZone || "America/New_York";
  const now = new Date();

  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz,
    timeZoneName: "short",
  }).format(now);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
    timeZoneName: "short",
  }).format(now);

  return `Today is ${dateStr}. Current time is ${timeStr}.`;
}

export async function POST(req: Request) {
  try {
    // ✅ 400 instead of 500 on invalid JSON / zod errors
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
      );
    }

    const body = parsed.data;

    const { prisma } = await import("@/lib/prisma");
    const { storeAssistantReply } = await import("@/lib/assistant/storeAssistant");

const widget = await prisma.widget.findUnique({
  where: { publicKey: body.key },
  select: {
    tenantId: true,
    enabled: true,
    allowedDomains: true,
    greeting: true,
    assistantName: true,
    tenant: {
      select: {
        timeZone: true,
        storeName: true,
        plan: true,
        billingStatus: true,
        trialEndsAt: true,
      },
    },
  },
});

const storeName = widget?.tenant?.storeName || "our store";

    if (!widget || widget.enabled === false) {
      return NextResponse.json(
        { ok: false, error: "Widget not found or disabled" },
        { status: 404, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
      );
    }

    const tenantId = widget.tenantId;
    const tenantTz = widget.tenant?.timeZone || "America/New_York";

    // ✅ Milestone 7: Allowed-domain enforcement FIRST (prevents DB spam)
const allowed = Array.isArray(widget.allowedDomains) ? widget.allowedDomains : [];
const originHost = getOriginHost(req);

if (!originHost) {
  return NextResponse.json(
    { ok: false, error: "Origin not allowed (missing Origin/Referer)" },
    { status: 403, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
  );
}

// ✅ Enforce always:
// - if allowedDomains is empty → only ALWAYS_ALLOWED_HOSTS pass
// - if allowedDomains has entries → allowlist + ALWAYS_ALLOWED_HOSTS pass
if (!isHostAllowed(originHost, allowed)) {
  return NextResponse.json(
    { ok: false, error: `Origin not allowed: ${originHost}` },
    { status: 403, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
  );
}

    // ✅ Milestone 7: Rate limiting (DB-backed) AFTER allowlist
// ✅ Milestone 7: Rate limiting (DB-backed) AFTER allowlist
let rl: any = { ok: true };

try {
  const { rateLimitOrThrow } = await import("@/lib/security/rateLimit");
  rl = await rateLimitOrThrow({
    prisma,
    req,
    namespace: "public_message",
    widgetKey: body.key,
    limit: 30,
    windowSeconds: 60,
  });
} catch (e) {
  // Fail-open so a temporary DB/ratelimit issue doesn't break the widget entirely
  console.warn("[rateLimit] failed open", e);
  rl = { ok: true };
}

if (!rl.ok) {
  return NextResponse.json(
    { ok: false, error: "Rate limited" },
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-store",
        "Retry-After": String(rl.resetSeconds ?? 60),
      },
    }
  );
}

// ✅ Milestone 8: Billing + plan gating
const tenantPlan = widget.tenant?.plan ?? "PRO";
const tenantBillingStatus = widget.tenant?.billingStatus ?? "NONE";
const tenantTrialEndsAt = widget.tenant?.trialEndsAt ?? null;

const { assertTenantCanUsePublicEndpoints, getEntitlements } = await import("@/lib/entitlements");
const { getYearMonth, incrementUsageMonth } = await import("@/lib/usage");

try {
  assertTenantCanUsePublicEndpoints(tenantBillingStatus, tenantTrialEndsAt);
} catch {
  return NextResponse.json(
    paywallJson({
      reason: "Billing inactive. Please upgrade or fix billing to use the widget.",
      plan: tenantPlan,
      billingStatus: tenantBillingStatus,
    }),
    { status: 402, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
  );
}

const entitlements = getEntitlements(tenantPlan);

    const customerName =
      (body.customerName || "Customer").toString().trim() || "Customer";
    const customerEmail =
      (body.customerEmail || "").toString().trim() || null;

    const channel = (body.channel || "web").toString().trim() || "web";
    const subject = (body.subject || "Support").toString().trim() || "Support";
    const tags = (body.tags || "").toString();

    const aiEnabled = body.aiEnabled === false ? false : true;

    let conversationId = (body.conversationId || "").toString().trim();
    let allowAi = aiEnabled;
    let resetConversationId = false;

    // 2) If continuing, confirm convo belongs to tenant.
    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId },
        select: { id: true, aiEnabled: true },
      });

      if (!existing?.id) {
        resetConversationId = true;
        conversationId = "";
      } else {
        if (typeof existing.aiEnabled === "boolean") allowAi = existing.aiEnabled;
      }
    }

// 3) Create conversation if new
if (!conversationId) {
  // ✅ Milestone 8: Monthly conversation cap (only blocks new conversations)
  const yearMonth = getYearMonth(new Date(), tenantTz);

  const usage = await prisma.usageMonth.findUnique({
    where: { tenantId_yearMonth: { tenantId, yearMonth } },
    select: { conversations: true },
  });

  const convoCount = usage?.conversations ?? 0;

  if (convoCount >= entitlements.maxConversationsPerMonth) {
    return NextResponse.json(
      paywallJson({
        reason: "Monthly conversation limit reached. Please upgrade to continue.",
        plan: tenantPlan ?? null,
        billingStatus: tenantBillingStatus ?? null,
        limitName: "conversations_per_month",
        limitValue: entitlements.maxConversationsPerMonth,
        currentValue: convoCount,
      }),
      { status: 402, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
    );
  }

  const convo = await prisma.conversation.create({
    data: {
      tenantId,
      customerName,
      customerEmail,
      subject,
      channel,
      tags,
      aiEnabled,
      status: aiEnabled ? "open" : "waiting",
      lastMessageAt: new Date(),
    },
    select: { id: true },
  });

  conversationId = convo.id;

  // ✅ Count this new conversation
  await incrementUsageMonth(tenantId, tenantTz, { conversations: 1 });
}

    // 4) Save customer message
    await prisma.message.create({
      data: {
        conversationId,
        role: "customer",
        content: body.text.trim(),
      },
    });

// ✅ Milestone 8: Count customer inbound messages
await incrementUsageMonth(tenantId, tenantTz, { messages: 1 });

    // ✅ Date/time questions: answer from SERVER clock (no OpenAI needed)
    if (isDateTimeQuestion(body.text)) {
      const reply = serverDateTimeReply(tenantTz);

      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      const messages = await prisma.message.findMany({
        where: { conversationId, role: { in: ["customer", "assistant", "staff"] } },
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      });

      return NextResponse.json(
        { ok: true, conversationId, messages, resetConversationId },
        { headers: corsHeaders }
      );
    }

    // 5) Re-check allowAi from DB (staff takeover wins)
    try {
      const row = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { aiEnabled: true },
      });
      if (typeof row?.aiEnabled === "boolean") allowAi = row.aiEnabled;
    } catch {}

    // 6) AI reply
    if (allowAi) {
      let reply = "";
      try {
        reply = await storeAssistantReply({
          tenantId,
          conversationId,
          userText: body.text.trim(),
          channel,
        });
      } catch (e) {
        console.error("[public/widget/message] storeAssistantReply failed; fallback", e);
        reply = assistantAutoReply(body.text, storeName);
      }

      await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply || assistantAutoReply(body.text, storeName),
        },
      });
    }

    // 7) Update lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId, role: { in: ["customer", "assistant", "staff"] } },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json(
      { ok: true, conversationId, messages, resetConversationId },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[public/widget/message] error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Public widget message failed" },
      { status: 500, headers: { ...corsHeaders, "Cache-Control": "no-store" } }
    );
  }
}
