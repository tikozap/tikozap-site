// src/lib/security/rateLimit.ts
import crypto from "crypto";

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
};

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function getIp(req: Request) {
  // Vercel usually provides x-forwarded-for: "client, proxy1, proxy2"
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip") || "unknown";
}

/**
 * DB-backed rate limiter.
 * - windowSeconds: e.g. 60
 * - limit: e.g. 30
 * Keyed by (namespace + widgetKey + ip) so one abusive site/ip can't hammer you.
 */
export async function rateLimitOrThrow(opts: {
  prisma: any;
  req: Request;
  namespace: string; // e.g. "public_message"
  widgetKey: string; // publicKey
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { prisma, req, namespace, widgetKey, limit, windowSeconds } = opts;

  const ip = getIp(req);
  const rawKey = `${namespace}:${widgetKey}:${ip}`;
  const key = sha1(rawKey);

  const now = new Date();
  const windowMs = windowSeconds * 1000;

  // Use "upsert then increment" pattern with reset handling.
  // We do a small transaction to keep it consistent.
  const result = await prisma.$transaction(async (tx: any) => {
    let row = await tx.rateLimitBucket.findUnique({
      where: { key },
      select: { key: true, count: true, resetAt: true },
    });

    if (!row) {
      row = await tx.rateLimitBucket.create({
        data: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
        select: { key: true, count: true, resetAt: true },
      });
      return row;
    }

    // If window expired, reset
    if (row.resetAt.getTime() <= now.getTime()) {
      row = await tx.rateLimitBucket.update({
        where: { key },
        data: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        select: { key: true, count: true, resetAt: true },
      });
      return row;
    }

    // Same window, increment
    row = await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
      select: { key: true, count: true, resetAt: true },
    });

    return row;
  });

  const resetSeconds = Math.max(
    0,
    Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000)
  );

  if (result.count > limit) {
    return { ok: false, remaining: 0, resetSeconds };
  }

  return { ok: true, remaining: Math.max(0, limit - result.count), resetSeconds };
}

/** optional cleanup helper you can run manually later */
export async function purgeExpiredRateLimits(prisma: any) {
  const now = new Date();
  await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });
}
