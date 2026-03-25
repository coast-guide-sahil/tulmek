import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/infrastructure/database/drizzle/client";
import * as schema from "@/infrastructure/database/drizzle/schema";
import {
  ERROR_MESSAGES,
  PRE_SIGNUP,
  isTruthy,
} from "@interview-prep/config/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const requireEmailVerification = isTruthy(
  process.env.REQUIRE_EMAIL_VERIFICATION,
);

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  if (!requireEmailVerification) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const headersList = await headers();
  const origin = headersList.get("origin");
  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!origin || !appUrl || origin !== new URL(appUrl).origin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(headersList);
  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as { email?: string; otp?: string };
  const email =
    typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
  const otp = typeof parsed.otp === "string" ? parsed.otp.trim() : "";

  if (!email || !otp) {
    return Response.json(
      { error: "Email and OTP are required" },
      { status: 400 },
    );
  }

  const identifier = `pre-signup-otp:${email}`;
  const attemptsIdentifier = `pre-signup-attempts:${email}`;
  const now = new Date();

  const records = await db
    .select()
    .from(schema.verification)
    .where(
      and(
        eq(schema.verification.identifier, identifier),
        gt(schema.verification.expiresAt, now),
      ),
    )
    .limit(1);

  if (records.length === 0) {
    return Response.json(
      { error: ERROR_MESSAGES.OTP_EXPIRED },
      { status: 400 },
    );
  }

  const storedHash = records[0]!.value;
  const submittedHash = hashOtp(otp);

  if (!safeEqual(storedHash, submittedHash)) {
    // Track failed attempt
    const [attemptRecord] = await db
      .select({ id: schema.verification.id, value: schema.verification.value })
      .from(schema.verification)
      .where(eq(schema.verification.identifier, attemptsIdentifier))
      .limit(1);

    const attemptCount = attemptRecord
      ? parseInt(attemptRecord.value, 10) + 1
      : 1;

    if (attemptCount >= PRE_SIGNUP.MAX_OTP_ATTEMPTS) {
      // Max attempts reached — invalidate the OTP
      await db
        .delete(schema.verification)
        .where(eq(schema.verification.identifier, identifier));
      await db
        .delete(schema.verification)
        .where(eq(schema.verification.identifier, attemptsIdentifier));
      return Response.json(
        { error: ERROR_MESSAGES.OTP_EXPIRED },
        { status: 400 },
      );
    }

    if (attemptRecord) {
      await db
        .update(schema.verification)
        .set({ value: String(attemptCount) })
        .where(eq(schema.verification.id, attemptRecord.id));
    } else {
      await db.insert(schema.verification).values({
        id: randomUUID(),
        identifier: attemptsIdentifier,
        value: "1",
        expiresAt: records[0]!.expiresAt,
      });
    }

    return Response.json(
      { error: ERROR_MESSAGES.OTP_INVALID },
      { status: 400 },
    );
  }

  // Success — clean up OTP and attempt records
  await db
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, identifier));
  await db
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, attemptsIdentifier));

  const verifiedIdentifier = `pre-signup-verified:${email}`;

  await db
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, verifiedIdentifier));

  const expiresAt = new Date(
    now.getTime() + PRE_SIGNUP.VERIFIED_EXPIRY_SECONDS * 1000,
  );

  await db.insert(schema.verification).values({
    id: randomUUID(),
    identifier: verifiedIdentifier,
    value: "verified",
    expiresAt,
  });

  return Response.json({ verified: true });
}
