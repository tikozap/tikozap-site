// src/lib/auth.ts
import "server-only";

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Your existing function stays: returns { user, tenant } or null
 * We’ll add isDemo so billing routes can block demo mode cleanly.
 */
export async function getAuthedUserAndTenant(): Promise<
  | {
      isDemo?: boolean;
      user: { id: string; email: string; name?: string | null };
      tenant: { id: string; slug: string; name?: string | null };
    }
  | null
> {
  const jar = cookies();

  // --- DEMO SHORTCUT: if demo cookies are set, return a fake demo user/tenant ---
  const demoLoggedIn = jar.get("tz_demo_logged_in")?.value === "1";
  if (demoLoggedIn) {
    const slug = jar.get("tz_demo_tenant_slug")?.value || "Demo Boutique";
    const name = decodeURIComponent(jar.get("tz_demo_tenant_name")?.value || "Demo Boutique");

    return {
      isDemo: true,
      user: { id: "demo-user", email: "demo@tikozap.com", name: "Demo User" },
      tenant: { id: "demo-tenant", slug, name },
    };
  }

  // --- REAL SESSION / PRISMA AUTH (unchanged) ---
  const token =
    jar.get("tz_session")?.value ||
    jar.get("session")?.value ||
    jar.get("token")?.value ||
    getBearerTokenFromHeaders() ||
    "";

  const tenantId = jar.get("tz_tenant")?.value || "";

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  const user = session.user;

  if (tenantId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      include: { tenant: true },
    });
    if (membership?.tenant) {
      return { isDemo: false, user, tenant: membership.tenant as any };
    }
  }

  const firstMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { createdAt: "asc" },
  });

  if (!firstMembership?.tenant) return null;
  return { isDemo: false, user, tenant: firstMembership.tenant as any };
}

/**
 * Milestone 8 helper used by billing routes:
 * - Throws instead of returning null
 * - Blocks demo mode (demo users aren’t real DB users/tenants)
 */
export async function requireUserId(): Promise<string> {
  const ctx = await getAuthedUserAndTenant();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  if (ctx.isDemo) throw new Error("DEMO_MODE");
  return ctx.user.id;
}

/**
 * Sometimes it’s convenient to get both in one go.
 */
export async function requireUserAndTenant() {
  const ctx = await getAuthedUserAndTenant();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  if (ctx.isDemo) throw new Error("DEMO_MODE");
  return ctx;
}

function getBearerTokenFromHeaders(): string | null {
  const h = headers();
  const auth = h.get("authorization") || h.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer (.+)$/i);
  return m ? m[1] : null;
}
