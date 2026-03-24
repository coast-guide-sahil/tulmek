/** User roles — matches Better Auth admin plugin role values */
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Admin panel pagination */
export const ADMIN_PAGE_SIZE = 20;

/** Password validation */
export const PASSWORD_MIN_LENGTH = 8;

/** Debounce delay (ms) for email disposable check */
export const EMAIL_CHECK_DEBOUNCE_MS = 500;

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
