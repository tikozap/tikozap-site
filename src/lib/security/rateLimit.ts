// src/lib/security/rateLimit.ts
import crypto from "crypto";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
};

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function getIp(req: Request) {
  // Vercel: "client, proxy1, proxy2"
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip") || "unknown";
}

/**
 * DB-backed rate limiter.
 * - windowSeconds: e.g. 60
 * - limit: e.g. 30
 * Keyed by (namespace + widgetKey + ip)
 */
export async function rateLimitOrThrow(opts: {
  prisma: any;
  req: Request;
  namespace: string;
  widgetKey: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { prisma, req, namespace, widgetKey, limit, windowSeconds } = opts;

  const ip = getIp(req);
  const rawKey = `${namespace}:${widgetKey}:${ip}`;
  const key = sha1(rawKey);

  const now = new Date();
  const windowMs = windowSeconds * 1000;

  const result: { count: number; resetAt: Date; blocked: boolean } =
    await prisma.$transaction(async (tx: any) => {
      let row: { count: number; resetAt: Date } | null =
        await tx.rateLimitBucket.findUnique({
          where: { key },
          select: { count: true, resetAt: true },
        });

      // Create if missing (handle concurrent create)
      if (!row) {
        try {
          const created = await tx.rateLimitBucket.create({
            data: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
            select: { count: true, resetAt: true },
          });
          return { ...created, blocked: false };
        } catch (e: any) {
          // Prisma unique constraint violation
          if (e?.code !== "P2002") throw e;

          row = await tx.rateLimitBucket.findUnique({
            where: { key },
            select: { count: true, resetAt: true },
          });
          if (!row) throw e;
        }
      }

      // Expired window -> reset
      if (row.resetAt.getTime() <= now.getTime()) {
        const reset = await tx.rateLimitBucket.update({
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
      const updated = await tx.rateLimitBucket.update({
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

  // Rare race fallback
  if (result.count > limit) {
    return { ok: false, remaining: 0, resetSeconds };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - result.count),
    resetSeconds,
  };
}

/** optional cleanup helper you can run manually later */
export async function purgeExpiredRateLimits(prisma: any) {
  const now = new Date();
  await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });
}
