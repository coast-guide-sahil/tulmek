import { describe, it, expect, vi } from "vitest";
import { createValidateSignup } from "./validate-signup";
import type { ValidateSignupDeps } from "./validate-signup";
import type { EmailValidatorPort } from "../ports/email-validator.port";
import type { UserRepository } from "../ports/user-repository.port";

function createMockDeps(
  overrides: Partial<ValidateSignupDeps> = {},
): ValidateSignupDeps {
  const emailValidator: EmailValidatorPort = {
    isDisposable: vi.fn().mockReturnValue(false),
  };
  const userRepo: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  };
  return {
    emailValidator,
    userRepo,
    maxUsers: 100,
    ...overrides,
  };
}

describe("createValidateSignup", () => {
  it("returns Ok(true) for a valid non-disposable email under user limit", async () => {
    const deps = createMockDeps();
    const validate = createValidateSignup(deps);

    const result = await validate({ email: "user@example.com" });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(true);
  });

  it("returns Err(DISPOSABLE_EMAIL) for disposable emails", async () => {
    const deps = createMockDeps({
      emailValidator: {
        isDisposable: vi.fn().mockReturnValue(true),
      },
    });
    const validate = createValidateSignup(deps);

    const result = await validate({ email: "user@tempmail.com" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("DISPOSABLE_EMAIL");
  });

  it("returns Err(MAX_USERS_REACHED) when at capacity", async () => {
    const deps = createMockDeps({
      userRepo: {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        count: vi.fn().mockResolvedValue(100),
      },
      maxUsers: 100,
    });
    const validate = createValidateSignup(deps);

    const result = await validate({ email: "user@example.com" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MAX_USERS_REACHED");
  });

  it("returns Err(MAX_USERS_REACHED) when over capacity", async () => {
    const deps = createMockDeps({
      userRepo: {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        count: vi.fn().mockResolvedValue(150),
      },
      maxUsers: 100,
    });
    const validate = createValidateSignup(deps);

    const result = await validate({ email: "user@example.com" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MAX_USERS_REACHED");
  });

  it("checks disposable email before user count", async () => {
    const countFn = vi.fn().mockResolvedValue(0);
    const deps = createMockDeps({
      emailValidator: {
        isDisposable: vi.fn().mockReturnValue(true),
      },
      userRepo: {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        count: countFn,
      },
    });
    const validate = createValidateSignup(deps);

    await validate({ email: "user@tempmail.com" });

    // count should NOT be called if email is disposable (short-circuit)
    expect(countFn).not.toHaveBeenCalled();
  });

  it("allows signup when user count is exactly one below max", async () => {
    const deps = createMockDeps({
      userRepo: {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        count: vi.fn().mockResolvedValue(99),
      },
      maxUsers: 100,
    });
    const validate = createValidateSignup(deps);

    const result = await validate({ email: "user@example.com" });

    expect(result.ok).toBe(true);
  });
});
