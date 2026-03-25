import { describe, it, expect } from "vitest";
import { hashOtp } from "./otp";

describe("hashOtp", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashOtp("123456");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces consistent hashes for the same input", () => {
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashOtp("123456")).not.toBe(hashOtp("654321"));
  });

  it("handles empty string", () => {
    const hash = hashOtp("");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
