import { emailValidator } from "@/infrastructure/composition-root";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const appUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  try {
    if (!origin || !appUrl || origin !== new URL(appUrl).origin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(headersList);
  const { allowed, retryAfterMs } = checkRateLimit(`check-email:${ip}`);
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

  const isDisposable = emailValidator.isDisposable(email);
  return Response.json({ isDisposable });
}
