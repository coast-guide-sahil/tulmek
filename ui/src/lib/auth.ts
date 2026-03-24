import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { count } from "drizzle-orm";
import MailChecker from "mailchecker";
import { ROLES, RATE_LIMIT, ERROR_MESSAGES } from "@/lib/constants";

const parsedMaxUsers = parseInt(process.env.MAX_USERS ?? "100", 10);
const MAX_USERS = Number.isFinite(parsedMaxUsers) && parsedMaxUsers > 0
  ? parsedMaxUsers
  : 100;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: { enabled: true },
  rateLimit: {
    enabled: true,
    window: RATE_LIMIT.GLOBAL_WINDOW,
    max: RATE_LIMIT.GLOBAL_MAX,
    customRules: {
      "/sign-in/email": {
        window: RATE_LIMIT.SIGN_IN_WINDOW,
        max: RATE_LIMIT.SIGN_IN_MAX,
      },
      "/sign-up/email": {
        window: RATE_LIMIT.SIGN_UP_WINDOW,
        max: RATE_LIMIT.SIGN_UP_MAX,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email?.toLowerCase() ?? "";
          if (!MailChecker.isValid(email)) {
            throw new APIError("UNPROCESSABLE_ENTITY", {
              message: ERROR_MESSAGES.DISPOSABLE_EMAIL,
            });
          }
          const [result] = await db
            .select({ value: count() })
            .from(schema.user);
          if (result.value >= MAX_USERS) {
            throw new APIError("FORBIDDEN", {
              message: ERROR_MESSAGES.MAX_USERS,
            });
          }
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          if (adminEmail && email === adminEmail) {
            return { data: { ...user, email, role: ROLES.ADMIN } };
          }
          return { data: { ...user, email } };
        },
      },
    },
  },
  plugins: [
    adminPlugin({
      defaultRole: ROLES.USER,
    }),
    nextCookies(), // MUST be last
  ],
});
