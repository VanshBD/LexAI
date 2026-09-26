/**
 * In-memory sliding-window rate limiter.
 * Limits each IP to `limit` requests per `windowMs` milliseconds.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until the current window resets
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Checks if an IP address has exceeded the rate limit.
 * @param ip - The client IP address (from x-forwarded-for or req.ip).
 * @param limit - Maximum requests per window. Default: 20.
 * @param windowMs - Window duration in milliseconds. Default: 60_000 (1 minute).
 * @returns RateLimitResult indicating whether the request is allowed.
 */
export function checkRateLimit(ip: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= windowMs) {
    // No entry or window expired — start a fresh window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count++;
  store.set(ip, entry);
  return { allowed: true, remaining: limit - entry.count };
}
