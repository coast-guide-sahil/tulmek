export type DomainError =
  | { readonly code: "DISPOSABLE_EMAIL"; readonly message: string }
  | { readonly code: "MAX_USERS_REACHED"; readonly message: string }
  | { readonly code: "EMAIL_TAKEN"; readonly message: string }
  | { readonly code: "USER_NOT_FOUND"; readonly message: string }
  | { readonly code: "UNAUTHORIZED"; readonly message: string }
  | { readonly code: "FORBIDDEN"; readonly message: string };

export const DomainErrors = {
  disposableEmail: (): DomainError => ({
    code: "DISPOSABLE_EMAIL",
    message: "Disposable email addresses are not allowed. Please use a permanent email address.",
  }),
  maxUsersReached: (): DomainError => ({
    code: "MAX_USERS_REACHED",
    message: "Maximum user limit reached. Registration is closed.",
  }),
  emailTaken: (): DomainError => ({
    code: "EMAIL_TAKEN",
    message: "An account with this email already exists.",
  }),
  userNotFound: (): DomainError => ({
    code: "USER_NOT_FOUND",
    message: "User not found.",
  }),
  unauthorized: (): DomainError => ({
    code: "UNAUTHORIZED",
    message: "Authentication required.",
  }),
  forbidden: (): DomainError => ({
    code: "FORBIDDEN",
    message: "Insufficient permissions.",
  }),
} as const;
