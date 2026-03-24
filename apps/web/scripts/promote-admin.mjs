#!/usr/bin/env node

/**
 * Promote an existing user to admin role.
 *
 * Usage:
 *   pnpm db:promote-admin <email>
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in env (or .env.local).
 *
 * Behavior:
 *   - Finds user by email (case-insensitive)
 *   - If user doesn't exist → exits with error (sign up first)
 *   - If user is already admin → no-op (idempotent)
 *   - If user is a regular user → promotes to admin
 *   - Prints confirmation with user details
 *
 * Security:
 *   - Does NOT create users (no phantom accounts)
 *   - Does NOT accept passwords (user sets their own via sign-up)
 *   - Requires direct DB credentials (only someone with prod access can run this)
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local if running locally
try {
  const envPath = resolve(import.meta.dirname, "../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // No .env.local — that's fine, env vars should be set externally
}

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("Usage: pnpm db:promote-admin <email>");
  console.error("Example: pnpm db:promote-admin admin@example.com");
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
  console.error("Set them in .env.local or as environment variables.");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
  // Find user by email
  const result = await db.execute({
    sql: "SELECT id, name, email, role FROM user WHERE LOWER(email) = ?",
    args: [email],
  });

  const user = result.rows[0];

  if (!user) {
    console.error(`Error: No user found with email "${email}".`);
    console.error("The user must sign up first, then you can promote them.");
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`✓ ${user.name} (${user.email}) is already admin. Nothing to do.`);
    return;
  }

  // Promote to admin
  await db.execute({
    sql: "UPDATE user SET role = 'admin' WHERE id = ?",
    args: [user.id],
  });

  console.log(`✓ Promoted ${user.name} (${user.email}) from "${user.role}" to "admin".`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
