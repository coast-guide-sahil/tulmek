import { describe, it, expect } from "vitest";
import { DomainErrors } from "./errors";
import type { DomainError } from "./errors";

describe("DomainErrors", () => {
  it("creates DISPOSABLE_EMAIL error", () => {
    const error: DomainError = DomainErrors.disposableEmail();
    expect(error.code).toBe("DISPOSABLE_EMAIL");
    expect(error.message).toContain("Disposable email");
  });

  it("creates MAX_USERS_REACHED error", () => {
    const error = DomainErrors.maxUsersReached();
    expect(error.code).toBe("MAX_USERS_REACHED");
    expect(error.message).toContain("Maximum user limit");
  });

  it("creates EMAIL_TAKEN error", () => {
    const error = DomainErrors.emailTaken();
    expect(error.code).toBe("EMAIL_TAKEN");
    expect(error.message).toContain("already exists");
  });

  it("creates USER_NOT_FOUND error", () => {
    const error = DomainErrors.userNotFound();
    expect(error.code).toBe("USER_NOT_FOUND");
    expect(error.message).toContain("not found");
  });

  it("creates UNAUTHORIZED error", () => {
    const error = DomainErrors.unauthorized();
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toContain("Authentication required");
  });

  it("creates FORBIDDEN error", () => {
    const error = DomainErrors.forbidden();
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toContain("Insufficient permissions");
  });

  it("returns a new object each call (no shared state)", () => {
    const a = DomainErrors.disposableEmail();
    const b = DomainErrors.disposableEmail();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
