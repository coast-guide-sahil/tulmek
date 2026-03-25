import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/infrastructure/database/drizzle/client";
import * as schema from "@/infrastructure/database/drizzle/schema";
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

  if (records[0]!.value !== otp) {
    return Response.json(
      { error: ERROR_MESSAGES.OTP_INVALID },
      { status: 400 },
    );
  }

  await db
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, identifier));

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
