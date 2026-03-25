"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrength } from "@/components/password-strength";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  PASSWORD_MIN_LENGTH,
  EMAIL_CHECK_DEBOUNCE_MS,
  ERROR_MESSAGES,
} from "@tulmek/config/constants";

type Step = "email" | "otp" | "details";

const WARNING_ICON = (
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
);

const SPINNER = (
  <svg
    className="h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export function SignUpForm({
  requireEmailVerification,
}: {
  requireEmailVerification: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(
    requireEmailVerification ? "email" : "details",
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  function handleEmailChange(value: string) {
    setEmail(value);
    setEmailWarning("");

    if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);

    if (value && value.includes("@")) {
      emailTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value }),
          });
          const { isDisposable } = (await res.json()) as {
            isDisposable?: boolean;
          };
          if (isDisposable) {
            setEmailWarning(ERROR_MESSAGES.DISPOSABLE_EMAIL);
          }
        } catch {
          // Server-side hook is the authoritative check
        }
      }, EMAIL_CHECK_DEBOUNCE_MS);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/pre-signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to send verification code.");
        setLoading(false);
        setTimeout(() => errorRef.current?.focus(), 100);
        return;
      }

      setStep("otp");
      setLoading(false);
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/pre-signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Verification failed. Please try again.");
        setLoading(false);
        setTimeout(() => errorRef.current?.focus(), 100);
        return;
      }

      setStep("details");
      setOtp("");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setResent(false);
    setError("");

    try {
      const res = await fetch("/api/pre-signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to resend code.");
        return;
      }

      setResent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      if (signUpError.status === 403 && requireEmailVerification) {
        setError(
          "Your email verification has expired. Please verify again.",
        );
        setStep("email");
        setOtp("");
        setLoading(false);
        return;
      }
      setError(signUpError.message ?? ERROR_MESSAGES.SIGN_UP_FAILED);
      setLoading(false);
      setTimeout(() => errorRef.current?.focus(), 100);
      return;
    }

    if (!data?.token && !requireEmailVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push("/");
  }

  const canSendOtp =
    email.length > 0 && email.includes("@") && !emailWarning && !loading;
  const canVerifyOtp = otp.length === 6 && !loading;
  const canSignUp =
    name.length > 0 &&
    password.length >= PASSWORD_MIN_LENGTH &&
    (!requireEmailVerification
      ? email.length > 0 && !emailWarning
      : true) &&
    !loading;

  const errorBlock = error ? (
    <p
      ref={errorRef}
      id="signup-error"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
      role="alert"
      tabIndex={-1}
    >
      {WARNING_ICON}
      <span>{error}</span>
    </p>
  ) : null;

  const emailInput = (
    <div>
      <label
        htmlFor="email"
        className="mb-1.5 block text-sm font-medium text-card-foreground"
      >
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        autoComplete="email"
        aria-invalid={!!emailWarning || !!error || undefined}
        aria-describedby={
          emailWarning
            ? "email-warning"
            : error
              ? "signup-error"
              : undefined
        }
        className={`w-full rounded-lg border bg-input px-4 py-3 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          emailWarning ? "border-destructive" : "border-border"
        }`}
        placeholder="you@example.com"
      />
      {emailWarning && (
        <p
          id="email-warning"
          className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive"
          role="alert"
        >
          {WARNING_ICON}
          <span>{emailWarning}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[min(24rem,100%)] rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* ---- STEP: EMAIL ---- */}
        {step === "email" && (
          <>
            <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
              Create an account
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Enter your email to get started
            </p>

            <form
              onSubmit={handleSendOtp}
              className="flex flex-col gap-4"
              noValidate
            >
              {emailInput}
              {errorBlock}

              <button
                type="submit"
                disabled={!canSendOtp}
                aria-disabled={!canSendOtp}
                className="min-h-[44px] w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    {SPINNER}
                    Sending code...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </>
        )}

        {/* ---- STEP: OTP ---- */}
        {step === "otp" && (
          <>
            <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
              Check your email
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <strong className="text-card-foreground">{email}</strong>
            </p>

            <form
              onSubmit={handleVerifyOtp}
              className="flex flex-col gap-4"
              noValidate
            >
              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification code
                </label>
                <input
                  ref={otpInputRef}
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "signup-error" : undefined}
                  className={`w-full rounded-lg border bg-input px-4 py-3 text-center text-2xl tracking-[0.3em] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    error ? "border-destructive" : "border-border"
                  }`}
                />
              </div>

              {errorBlock}

              <button
                type="submit"
                disabled={!canVerifyOtp}
                aria-disabled={!canVerifyOtp}
                className="min-h-[44px] w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    {SPINNER}
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
                onClick={handleResendOtp}
                className="min-h-[44px] flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {resent ? "Code resent!" : "Didn't get the code? Resend"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  setResent(false);
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          </>
        )}

        {/* ---- STEP: DETAILS ---- */}
        {step === "details" && (
          <>
            <h1 className="mb-1 text-xl font-semibold text-card-foreground sm:text-2xl">
              {requireEmailVerification
                ? "Complete your account"
                : "Create an account"}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {requireEmailVerification ? (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <svg
                    className="h-4 w-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <span className="font-medium text-card-foreground">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                    }}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Change
                  </button>
                </span>
              ) : (
                "Sign up to get started with TULMEK"
              )}
            </p>

            <form
              onSubmit={handleSignUp}
              className="flex flex-col gap-4"
              noValidate
            >
              {!requireEmailVerification && emailInput}

              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-card-foreground"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "signup-error" : undefined}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-card-foreground"
                >
                  Password
                </label>
                <PasswordInput
                  id="password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  value={password}
                  onChange={setPassword}
                  placeholder={`Min. ${PASSWORD_MIN_LENGTH} characters`}
                  autoComplete="new-password"
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "signup-error" : undefined}
                />
                <PasswordStrength password={password} />
              </div>

              {errorBlock}

              <button
                type="submit"
                disabled={!canSignUp}
                aria-disabled={!canSignUp}
                className="min-h-[44px] w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    {SPINNER}
                    Creating account...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>
          </>
        )}

        {/* ---- Footer ---- */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
          <Link
            href="/"
            className="min-h-[44px] flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
