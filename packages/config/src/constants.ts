/** Case-insensitive truthy check for env vars ("true", "1", "yes") */
export function isTruthy(value: string | undefined | null): boolean {
  return ["true", "1", "yes"].includes((value ?? "").trim().toLowerCase());
}

/** User roles — matches Better Auth admin plugin role values */
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const satisfies Record<string, string>;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Admin panel pagination */
export const ADMIN_PAGE_SIZE = 20;

/** Password validation */
export const PASSWORD_MIN_LENGTH = 8;

/** Debounce delay (ms) for email disposable check */
export const EMAIL_CHECK_DEBOUNCE_MS = 500;

/** Pre-signup email verification */
export const PRE_SIGNUP = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300,
  VERIFIED_EXPIRY_SECONDS: 180,
  OTP_COOLDOWN_SECONDS: 60,
  MAX_OTP_ATTEMPTS: 5,
} as const;

/** Rate limit for custom API routes (pre-signup, check-email) */
export const CUSTOM_ROUTE_RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 20,
} as const;

/** Rate limit configuration */
export const RATE_LIMIT = {
  GLOBAL_WINDOW: 60,
  GLOBAL_MAX: 100,
  SIGN_IN_WINDOW: 60,
  SIGN_IN_MAX: 10,
  SIGN_UP_WINDOW: 60,
  SIGN_UP_MAX: 5,
} as const;

/** Error messages shown to users */
export const ERROR_MESSAGES = {
  DISPOSABLE_EMAIL:
    "Disposable email addresses are not allowed. Please use a permanent email address.",
  MAX_USERS: "Maximum user limit reached. Registration is closed.",
  EMAIL_ALREADY_EXISTS:
    "An account with this email already exists. Please sign in instead.",
  OTP_COOLDOWN: "Please wait before requesting another code.",
  OTP_EXPIRED: "Code expired or not found. Please request a new one.",
  OTP_INVALID: "Invalid code. Please try again.",
  EMAIL_NOT_VERIFIED: "Email must be verified before signing up.",
  SIGN_UP_FAILED: "Sign up failed. Please try again.",
  SIGN_IN_FAILED: "Sign in failed. Please try again.",
  SET_ROLE_FAILED: "Failed to update role.",
  BAN_FAILED: "Failed to ban user.",
  UNBAN_FAILED: "Failed to unban user.",
  REMOVE_FAILED: "Failed to remove user.",
  REMOVE_CONFIRM: "Are you sure you want to permanently remove this user?",
} as const;

/** App metadata */
export const APP_NAME = "Interview Prep";
