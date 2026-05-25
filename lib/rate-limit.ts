import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from './auth';

/**
 * Lightweight in-memory rate limiter. Suitable for single-instance deploys.
 * For multi-instance, swap for Redis-backed (e.g. @upstash/ratelimit).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export async function rateLimit(
  scope: string,
  opts: { limit: number; windowMs: number },
): Promise<NextResponse | null> {
  const store = await cookies();
  const sessionKey = store.get(SESSION_COOKIE_NAME)?.value ?? 'anon';
  const key = `${scope}:${sessionKey.slice(0, 32)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }
  if (bucket.count >= opts.limit) {
    const retryMs = bucket.resetAt - now;
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(retryMs / 1000)),
        },
      },
    );
  }
  bucket.count++;
  return null;
}

// Tiny housekeeping: trim oldest entries if the map grows large.
setInterval(() => {
  if (buckets.size < 1000) return;
  const now = Date.now();
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}, 60_000).unref?.();
