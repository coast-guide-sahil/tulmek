import { randomInt, randomUUID } from "crypto";
import { headers } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { emailValidator } from "@/infrastructure/composition-root";
import { db } from "@/infrastructure/database/drizzle/client";
import * as schema from "@/infrastructure/database/drizzle/schema";
import { sendOTPEmail } from "@/infrastructure/email/resend";
import { ERROR_MESSAGES, PRE_SIGNUP } from "@interview-prep/config/constants";

const requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === "true";

export async function POST(req: Request) {
  if (!requireEmailVerification) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const headersList = await headers();
  const origin = headersList.get("origin");
  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && origin) {
    const expected = new URL(appUrl).origin;
    if (origin !== expected) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || email.length > 254 || !email.includes("@")) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  if (emailValidator.isDisposable(email)) {
    return Response.json(
      { error: ERROR_MESSAGES.DISPOSABLE_EMAIL },
      { status: 422 },
    );
  }

  const existingUser = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return Response.json(
      { error: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS },
      { status: 409 },
    );
  }

  const identifier = `pre-signup-otp:${email}`;
  const now = new Date();
  const cooldownThreshold = new Date(
    now.getTime() - PRE_SIGNUP.OTP_COOLDOWN_SECONDS * 1000,
  );

  const existing = await db
    .select({ createdAt: schema.verification.createdAt })
    .from(schema.verification)
    .where(
      and(
        eq(schema.verification.identifier, identifier),
        gt(schema.verification.createdAt, cooldownThreshold),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return Response.json(
      { error: ERROR_MESSAGES.OTP_COOLDOWN },
      { status: 429 },
    );
  }

  await db
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, identifier));

  const otp = randomInt(0, 10 ** PRE_SIGNUP.OTP_LENGTH)
    .toString()
    .padStart(PRE_SIGNUP.OTP_LENGTH, "0");
  const expiresAt = new Date(
    now.getTime() + PRE_SIGNUP.OTP_EXPIRY_SECONDS * 1000,
  );

  await db.insert(schema.verification).values({
    id: randomUUID(),
    identifier,
    value: otp,
    expiresAt,
  });

  await sendOTPEmail(email, otp);

  return Response.json({ success: true });
}
