// src/lib/security/rateLimit.ts
import crypto from "crypto";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
};

type BucketRow = {
  count: number;
  resetAt: Date;
};

type TxResult = BucketRow & {
  blocked: boolean;
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
 *
 * Behavior:
 * - First request in a new window creates row count=1
 * - Within window: increments until reaching limit
 * - Once count >= limit: blocks WITHOUT writing (no increment spam)
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

  const result: TxResult = await prisma.$transaction(async (tx: any) => {
    let row: BucketRow | null = await tx.rateLimitBucket.findUnique({
      where: { key },
      select: { count: true, resetAt: true },
    });

    // Create if missing (handle concurrent create via P2002)
    if (!row) {
      try {
        const created: BucketRow = await tx.rateLimitBucket.create({
          data: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
          select: { count: true, resetAt: true },
        });
        return { ...created, blocked: false };
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;

        row = await tx.rateLimitBucket.findUnique({
          where: { key },
          select: { count: true, resetAt: true },
        });

        if (!row) throw e; // extremely unlikely, but keeps us honest
      }
    }

    // If window expired, reset to 1
    if (row.resetAt.getTime() <= now.getTime()) {
      const reset: BucketRow = await tx.rateLimitBucket.update({
        where: { key },
        data: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        select: { count: true, resetAt: true },
      });
      return { ...reset, blocked: false };
    }

    // Same window: if at/over limit, block WITHOUT writing
    if (row.count >= limit) {
      return { ...row, blocked: true };
    }

    // Otherwise increment
    const updated: BucketRow = await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
      select: { count: true, resetAt: true },
    });

    return { ...updated, blocked: false };
  });

  const resetSeconds = Math.max(
    0,
    Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000)
  );

  if (result.blocked) {
    return { ok: false, remaining: 0, resetSeconds };
  }

  // Safety net for rare races (shouldn’t happen often, but harmless)
  if (result.count > limit) {
    return { ok: false, remaining: 0, resetSeconds };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - result.count),
    resetSeconds,
  };
}

/** Optional cleanup helper you can run manually later */
export async function purgeExpiredRateLimits(prisma: any) {
  const now = new Date();
  await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });
}
