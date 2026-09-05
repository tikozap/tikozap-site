import 'server-only';

type Bucket = {
  count: number;
  resetAt: number;
};

type Store = Map<string, Bucket>;

const globalForRateLimit = globalThis as unknown as {
  __tzRateLimitStore?: Store;
};

const store: Store = globalForRateLimit.__tzRateLimitStore ?? new Map<string, Bucket>();
if (!globalForRateLimit.__tzRateLimitStore) {
  globalForRateLimit.__tzRateLimitStore = store;
}

function clientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for') || '';
  const firstForwarded = xForwardedFor.split(',')[0]?.trim();
  if (firstForwarded) return firstForwarded;

  const realIp = req.headers.get('x-real-ip') || '';
  if (realIp) return realIp;

  const connectingIp = req.headers.get('cf-connecting-ip') || '';
  if (connectingIp) return connectingIp;

  return 'unknown';
}

function maybeCleanup(now: number) {
  if (store.size < 2000) return;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  req: Request,
  opts: { namespace: string; limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  maybeCleanup(now);

  const key = `${opts.namespace}:${clientIp(req)}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - 1),
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= opts.limit) {
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    ok: true,
    limit: opts.limit,
    remaining: Math.max(0, opts.limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.ok) headers['Retry-After'] = String(result.retryAfterSeconds);
  return headers;
}
