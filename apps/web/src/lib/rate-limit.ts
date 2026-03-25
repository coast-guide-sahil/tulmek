/**
 * In-memory sliding-window rate limiter.
 *
 * Limitation: On serverless platforms (Vercel, AWS Lambda) each cold-start
 * gets a fresh Map, so this only limits bursts within a single warm instance.
 * It is NOT a substitute for a distributed rate limiter (e.g. Upstash Redis).
 *
 * Critical routes are additionally protected by DB-backed limits:
 *   - verify-otp: max 5 attempts per OTP (tracked in verification table)
 *   - send-otp: 60 s cooldown per email (tracked in verification table)
 */
import { CUSTOM_ROUTE_RATE_LIMIT } from "@tulmek/config/constants";

const { WINDOW_MS, MAX_REQUESTS } = CUSTOM_ROUTE_RATE_LIMIT;

type Entry = { timestamps: number[] };

const store: Map<string, Entry> =
  ((globalThis as Record<string, unknown>).__rateLimitStore as Map<
    string,
    Entry
  >) ??
  (() => {
    const m = new Map<string, Entry>();
    (globalThis as Record<string, unknown>).__rateLimitStore = m;
    return m;
  })();

let callCount = 0;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterMs: number;
} {
  if (++callCount % 1000 === 0) cleanup();

  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0]!;
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
