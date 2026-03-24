import { BetterAuthAdapter } from "./auth/better-auth.adapter";
import { DrizzleUserRepository } from "./database/drizzle/user.repository";
import { MailcheckerAdapter } from "./email/mailchecker.adapter";
import { createValidateSignup } from "@interview-prep/core/use-cases";

export { auth } from "./auth/better-auth.config";

const parsedMaxUsers = parseInt(process.env.MAX_USERS ?? "100", 10);
const maxUsers =
  Number.isFinite(parsedMaxUsers) && parsedMaxUsers > 0
    ? parsedMaxUsers
    : 100;

export const authProvider = new BetterAuthAdapter();
export const userRepo = new DrizzleUserRepository();
export const emailValidator = new MailcheckerAdapter();

export const useCases = {
  validateSignup: createValidateSignup({ emailValidator, userRepo, maxUsers }),
};
