// src/app/api/shopify/connect/route.ts

import "server-only";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAuthedUserAndTenant } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHOPIFY_OAUTH_COOKIE = "tz_shopify_oauth";

function normalizeShopDomain(value: string): string | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\/+$/, "");

  if (
    !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

function requireShopifyConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const appUrl = process.env.SHOPIFY_APP_URL?.trim().replace(/\/+$/, "");
  const scopes =
    process.env.SHOPIFY_SCOPES?.trim() || "read_products";

  if (!apiKey) {
    throw new Error("Missing SHOPIFY_API_KEY");
  }

  if (!appUrl) {
    throw new Error("Missing SHOPIFY_APP_URL");
  }

  return {
    apiKey,
    appUrl,
    scopes,
  };
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthedUserAndTenant();

    if (!auth) {
      return NextResponse.redirect(
        new URL("/login?next=/dashboard/widget/test", req.url)
      );
    }

    const requestUrl = new URL(req.url);
    const shop = normalizeShopDomain(
      requestUrl.searchParams.get("shop") || ""
    );

    if (!shop) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/widget/test?shopify=invalid-shop",
          req.url
        )
      );
    }

    const { apiKey, appUrl, scopes } = requireShopifyConfig();

    const state = randomBytes(32).toString("hex");
    const redirectUri = `${appUrl}/api/shopify/callback`;

    const authorizeUrl = new URL(
      `https://${shop}/admin/oauth/authorize`
    );

    authorizeUrl.searchParams.set("client_id", apiKey);
    authorizeUrl.searchParams.set("scope", scopes);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set({
      name: SHOPIFY_OAUTH_COOKIE,
      value: JSON.stringify({
        state,
        tenantId: auth.tenant.id,
        shop,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    console.error("[shopify-connect]", error);

    return NextResponse.redirect(
      new URL(
        "/dashboard/widget/test?shopify=connect-error",
        req.url
      )
    );
  }
}