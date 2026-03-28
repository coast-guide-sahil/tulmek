import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Simple in-memory rate limiter: max 10 per minute per IP. */
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/**
 * Resolve the subscribers.json path.
 * In development `process.cwd()` is the `apps/web` directory;
 * we store subscribers alongside hub content in `packages/content`.
 */
function getSubscribersPath(): string {
  return resolve(process.cwd(), "../../packages/content/src/hub/subscribers.json");
}

async function readSubscribers(filePath: string): Promise<string[]> {
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  // --- Rate limit ---
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // --- Parse body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : undefined;

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // --- Persist ---
  const filePath = getSubscribersPath();

  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const subscribers = await readSubscribers(filePath);

    if (subscribers.includes(normalizedEmail)) {
      return NextResponse.json({ success: true });
    }

    subscribers.push(normalizedEmail);
    await writeFile(filePath, JSON.stringify(subscribers, null, 2) + "\n", "utf-8");
  } catch {
    return NextResponse.json(
      { error: "Could not save subscription. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
