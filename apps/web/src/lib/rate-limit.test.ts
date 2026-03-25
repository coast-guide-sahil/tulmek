import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("getClientIp", () => {
  it("returns first IP from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("returns single IP from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("trims whitespace from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "  1.2.3.4 , 5.6.7.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({
      "x-real-ip": "10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset the rate limit store between tests
    const store = (globalThis as Record<string, unknown>)
      .__rateLimitStore as Map<string, unknown>;
    if (store) store.clear();
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-key-allow");
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("allows up to MAX_REQUESTS requests in the window", () => {
    // CUSTOM_ROUTE_RATE_LIMIT.MAX_REQUESTS is 20
    for (let i = 0; i < 20; i++) {
      const result = checkRateLimit("test-key-max");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests after exceeding MAX_REQUESTS", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit("test-key-block");
    }
    const result = checkRateLimit("test-key-block");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("uses separate buckets for different keys", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit("key-a");
    }
    // key-b should still be allowed
    const result = checkRateLimit("key-b");
    expect(result.allowed).toBe(true);
  });

  it("allows requests again after window expires", () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 20; i++) {
        checkRateLimit("test-key-expire");
      }
      expect(checkRateLimit("test-key-expire").allowed).toBe(false);

      // Advance past the window (60 seconds)
      vi.advanceTimersByTime(61_000);

      expect(checkRateLimit("test-key-expire").allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
