// src/app/api/demo-login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthedUserAndTenant } from "@/lib/auth";
import { newWidgetPublicKey, isTzWidgetKey } from "@/lib/widgetKey";

export const runtime = "nodejs";

const COMMIT =
  (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) ||
  "local";

function tenantDisplayName(t: any) {
  return (
    (t && (("storeName" in t && t.storeName) || ("name" in t && t.name))) ||
    t?.slug ||
    "Your store"
  );
}

const widgetSelect = {
  id: true,
  createdAt: true,
  tenantId: true,
  publicKey: true,
  enabled: true,
  assistantName: true,
  greeting: true,
  brandColor: true,
  installedAt: true,
} as const;

// GET -> check current session + return widget info
export async function GET() {
  const auth = await getAuthedUserAndTenant();
  if (!auth) {
    return NextResponse.json({ ok: false }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const tenantName = tenantDisplayName(auth.tenant);

  const widget = await prisma.widget.findUnique({
    where: { tenantId: auth.tenant.id },
    select: {
      publicKey: true,
      enabled: true,
      assistantName: true,
      greeting: true,
      brandColor: true,
      installedAt: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      commit: COMMIT,
      tenant: {
        id: auth.tenant.id,
        slug: auth.tenant.slug,
        name: tenantName,
        storeName: tenantName,
      },
      widget,
      widgetPublicKey: widget?.publicKey || null,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

// POST -> create/reuse demo user + tenant, ensure widget exists/enabled, return publicKey
export async function POST() {
  const demoEmail = "demo-merchant@tikozap.test";

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, name: "Demo Merchant" },
  });

const DEMO_SLUG = "Demo Boutique";
const DEMO_STORE = "Demo Boutique";
const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

const tenant = await prisma.tenant.upsert({
  where: { slug: DEMO_SLUG },
  update: {
    storeName: DEMO_STORE,
    ownerId: user.id,
    plan: "PRO",
    billingStatus: "TRIALING",
    trialEndsAt,
  },
  create: {
    slug: DEMO_SLUG,
    storeName: DEMO_STORE,
    ownerId: user.id,
    plan: "PRO",
    billingStatus: "TRIALING",
    trialEndsAt,
  },
});

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: { role: "owner" },
    create: { userId: user.id, tenantId: tenant.id, role: "owner" },
  });

  // IMPORTANT:
  // - do NOT set publicKey in create (let @default(cuid()) generate it once)
let widget = await prisma.widget.upsert({
  where: { tenantId: tenant.id },
  update: {
    enabled: true,
    assistantName: `${DEMO_STORE} Assistant`,
    greeting: "Hi! How can I help today?",
    brandColor: "#111827",
  },
  create: {
    tenantId: tenant.id,
    publicKey: newWidgetPublicKey(),   // ✅ force tz_ on create
    enabled: true,
    assistantName: `${DEMO_STORE} Assistant`,
    greeting: "Hi! How can I help today?",
    brandColor: "#111827",
    installedAt: new Date(),
  },
  select: widgetSelect,
});

// rotate only when safe
const canRotate = process.env.NODE_ENV !== "production" || !widget.installedAt;

if (!isTzWidgetKey(widget.publicKey) && canRotate) {
  widget = await prisma.widget.update({
    where: { tenantId: tenant.id },
    data: { publicKey: newWidgetPublicKey() },
    select: widgetSelect,
  });
}

  // one-time repair ONLY if you previously overwrote publicKey to tenantId
  if (widget.publicKey === tenant.id) {
    const newKey = "tz_" + randomUUID().replace(/-/g, "");
    widget = await prisma.widget.update({
      where: { tenantId: tenant.id },
      data: { publicKey: newKey },
      select: widgetSelect,
    });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  const jar = cookies();
  jar.set("tz_session", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
  jar.set("tz_tenant", tenant.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });

  return NextResponse.json(
    {
      ok: true,
      commit: COMMIT,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.storeName,
        storeName: tenant.storeName,
      },
      widget: {
        publicKey: widget.publicKey,
        enabled: widget.enabled,
        assistantName: widget.assistantName,
        greeting: widget.greeting,
        brandColor: widget.brandColor,
        installedAt: widget.installedAt,
      },
      widgetPublicKey: widget.publicKey,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
