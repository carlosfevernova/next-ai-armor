/**
 * Minimal in-memory sliding-window rate limiter. Persists across warm
 * serverless invocations. For distributed rate limiting swap the underlying
 * map with `@upstash/redis` — the shape stays the same.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0]!;
    return { allowed: false, remaining: 0, resetInMs: windowMs - (now - oldest) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: limit - hits.length, resetInMs: 0 };
}
