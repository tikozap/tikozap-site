// src/app/api/shopify/callback/route.ts

import "server-only";

import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { getAuthedUserAndTenant } from "@/lib/auth";
import { encryptCredential } from "@/lib/credentialEncryption";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHOPIFY_OAUTH_COOKIE = "tz_shopify_oauth";
const OAUTH_MAX_AGE_SECONDS = 10 * 60;

type ShopifyOAuthCookie = {
  state: string;
  tenantId: string;
  shop: string;
};

type ShopifyAccessTokenResponse = {
  access_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

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
  const apiSecret =
    process.env.SHOPIFY_API_SECRET?.trim();

  if (!apiKey) {
    throw new Error("Missing SHOPIFY_API_KEY");
  }

  if (!apiSecret) {
    throw new Error("Missing SHOPIFY_API_SECRET");
  }

  return {
    apiKey,
    apiSecret,
  };
}

function safeEqual(
  left: string,
  right: string
): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    leftBuffer,
    rightBuffer
  );
}

function verifyShopifyHmac(
  url: URL,
  apiSecret: string
): boolean {
  const providedHmac =
    url.searchParams.get("hmac")?.trim();

  if (!providedHmac) {
    return false;
  }

  const message = Array.from(
    url.searchParams.entries()
  )
    .filter(([key]) => key !== "hmac")
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyComparison =
        leftKey.localeCompare(rightKey);

      if (keyComparison !== 0) {
        return keyComparison;
      }

      return leftValue.localeCompare(rightValue);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const calculatedHmac = crypto
    .createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");

  return safeEqual(
    calculatedHmac,
    providedHmac
  );
}

function parseOAuthCookie(
  value: string | undefined
): ShopifyOAuthCookie | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      value
    ) as Partial<ShopifyOAuthCookie>;

    if (
      typeof parsed.state !== "string" ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.shop !== "string"
    ) {
      return null;
    }

    if (
      !parsed.state ||
      !parsed.tenantId ||
      !parsed.shop
    ) {
      return null;
    }

    return {
      state: parsed.state,
      tenantId: parsed.tenantId,
      shop: parsed.shop,
    };
  } catch {
    return null;
  }
}

function redirectToWidget(
  req: Request,
  result: string
) {
  const response = NextResponse.redirect(
    new URL(
      `/dashboard/widget/test?shopify=${encodeURIComponent(
        result
      )}`,
      req.url
    )
  );

  response.cookies.delete(SHOPIFY_OAUTH_COOKIE);

  return response;
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthedUserAndTenant();

    if (!auth) {
      return redirectToWidget(
        req,
        "unauthorized"
      );
    }

    const requestUrl = new URL(req.url);

    const code =
      requestUrl.searchParams.get("code")?.trim();
    const state =
      requestUrl.searchParams.get("state")?.trim();
    const timestamp =
      requestUrl.searchParams
        .get("timestamp")
        ?.trim();

    const shop = normalizeShopDomain(
      requestUrl.searchParams.get("shop") || ""
    );

    /*
     * Read the HTTP-only OAuth cookie from the
     * incoming request.
     */
    const cookieHeader =
      req.headers.get("cookie") || "";

    const cookieValue = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) =>
        part.startsWith(
          `${SHOPIFY_OAUTH_COOKIE}=`
        )
      )
      ?.slice(
        SHOPIFY_OAUTH_COOKIE.length + 1
      );

    const storedOAuth = parseOAuthCookie(
      cookieValue
        ? decodeURIComponent(cookieValue)
        : undefined
    );

    if (
      !code ||
      !state ||
      !timestamp ||
      !shop ||
      !storedOAuth
    ) {
      return redirectToWidget(
        req,
        "invalid-callback"
      );
    }

    if (
      storedOAuth.tenantId !== auth.tenant.id
    ) {
      return redirectToWidget(
        req,
        "tenant-mismatch"
      );
    }

    if (
      storedOAuth.shop !== shop ||
      !safeEqual(storedOAuth.state, state)
    ) {
      return redirectToWidget(
        req,
        "state-mismatch"
      );
    }

    const timestampSeconds =
      Number(timestamp);

    const nowSeconds = Math.floor(
      Date.now() / 1000
    );

    if (
      !Number.isFinite(timestampSeconds) ||
      Math.abs(
        nowSeconds - timestampSeconds
      ) > OAUTH_MAX_AGE_SECONDS
    ) {
      return redirectToWidget(
        req,
        "expired"
      );
    }

    const { apiKey, apiSecret } =
      requireShopifyConfig();

    if (
      !verifyShopifyHmac(
        requestUrl,
        apiSecret
      )
    ) {
      return redirectToWidget(
        req,
        "invalid-hmac"
      );
    }

    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        }),
        cache: "no-store",
      }
    );

    const tokenJson =
      (await tokenResponse.json().catch(
        () => ({})
      )) as ShopifyAccessTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenJson.access_token
    ) {
      console.error(
        "[shopify-callback-token]",
        tokenResponse.status,
        tokenJson.error,
        tokenJson.error_description
      );

      return redirectToWidget(
        req,
        "token-error"
      );
    }

    const existingShopConnection =
      await prisma.shopifyConnection.findUnique({
        where: {
          shopDomain: shop,
        },
        select: {
          tenantId: true,
        },
      });

    if (
      existingShopConnection &&
      existingShopConnection.tenantId !==
        auth.tenant.id
    ) {
      return redirectToWidget(
        req,
        "shop-already-connected"
      );
    }

    const encryptedAccessToken =
      encryptCredential(
        tokenJson.access_token
      );

    await prisma.shopifyConnection.upsert({
      where: {
        tenantId: auth.tenant.id,
      },
      create: {
        tenantId: auth.tenant.id,
        shopDomain: shop,
        adminAccessTokenEncrypted:
          encryptedAccessToken,
        apiVersion: "2026-04",
        status: "connected",
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      update: {
        shopDomain: shop,
        adminAccessTokenEncrypted:
          encryptedAccessToken,
        apiVersion: "2026-04",
        status: "connected",
        connectedAt: new Date(),
        disconnectedAt: null,
      },
    });

    return redirectToWidget(
      req,
      "connected"
    );
  } catch (error) {
    console.error(
      "[shopify-callback]",
      error
    );

    return redirectToWidget(
      req,
      "callback-error"
    );
  }
}