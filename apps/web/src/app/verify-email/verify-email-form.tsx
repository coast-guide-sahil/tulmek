"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });

    if (verifyError) {
      setError(verifyError.message ?? "Invalid code. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  async function handleResend() {
    setResent(false);
    setError("");
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setResent(true);
  }

  if (!email) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-[min(24rem,100%)] rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <p className="text-muted-foreground">
            No email specified.{" "}
            <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[min(24rem,100%)] rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
          Check your email
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <strong className="text-card-foreground">{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="otp" className="sr-only">
              Verification code
            </label>
            <input
              ref={inputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoComplete="one-time-code"
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "verify-error" : undefined}
              className={`w-full rounded-lg border bg-input px-4 py-3 text-center text-2xl tracking-[0.3em] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                error ? "border-destructive" : "border-border"
              }`}
            />
          </div>

          {error && (
            <p
              id="verify-error"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              role="alert"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={otp.length < 6 || loading}
            aria-disabled={otp.length < 6 || loading}
            className="min-h-[44px] w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            className="min-h-[44px] flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {resent ? "Code resent!" : "Didn't get the code? Resend"}
          </button>
          <Link
            href="/sign-up"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Use a different email
          </Link>
        </div>
      </div>
    </div>
  );
}
