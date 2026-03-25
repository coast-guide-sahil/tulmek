import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, emailOTP } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { count, eq, and, gt } from "drizzle-orm";
import MailChecker from "mailchecker";
import {
  ROLES,
  RATE_LIMIT,
  ERROR_MESSAGES,
  PRE_SIGNUP,
  isTruthy,
} from "@tulmek/config/constants";
import { db } from "../database/drizzle/client";
import * as schema from "../database/drizzle/schema";
import { sendOTPEmail } from "../email/resend";

const parsedMaxUsers = parseInt(process.env.MAX_USERS ?? "100", 10);
const MAX_USERS =
  Number.isFinite(parsedMaxUsers) && parsedMaxUsers > 0
    ? parsedMaxUsers
    : 100;

const requireEmailVerification = isTruthy(
  process.env.REQUIRE_EMAIL_VERIFICATION,
);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Handled via pre-signup OTP flow
  },
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
          if (result && result.value >= MAX_USERS) {
            throw new APIError("FORBIDDEN", {
              message: ERROR_MESSAGES.MAX_USERS,
            });
          }

          let emailVerified = false;
          if (requireEmailVerification) {
            const verifiedIdentifier = `pre-signup-verified:${email}`;
            const deleted = await db
              .delete(schema.verification)
              .where(
                and(
                  eq(schema.verification.identifier, verifiedIdentifier),
                  gt(schema.verification.expiresAt, new Date()),
                ),
              )
              .returning({ id: schema.verification.id });

            if (deleted.length === 0) {
              throw new APIError("FORBIDDEN", {
                message: ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
              });
            }

            emailVerified = true;
          }

          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          if (adminEmail && email === adminEmail) {
            return {
              data: { ...user, email, emailVerified, role: ROLES.ADMIN },
            };
          }
          return { data: { ...user, email, emailVerified } };
        },
      },
    },
  },
  plugins: [
    adminPlugin({
      defaultRole: ROLES.USER,
    }),
    ...(requireEmailVerification
      ? [
          emailOTP({
            otpLength: PRE_SIGNUP.OTP_LENGTH,
            expiresIn: PRE_SIGNUP.OTP_EXPIRY_SECONDS,
            sendVerificationOnSignUp: false,
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
              if (type === "email-verification") {
                await sendOTPEmail(email, otp);
              }
            },
          }),
        ]
      : []),
    nextCookies(), // MUST be last
  ],
});
