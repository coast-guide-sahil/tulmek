"use client";

import { useState, useCallback, useRef } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeState = "idle" | "loading" | "success" | "error";

export function EmailSubscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubscribeState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setState("error");
        setErrorMsg("Please enter a valid email address.");
        inputRef.current?.focus();
        return;
      }

      setState("loading");
      setErrorMsg("");

      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });

        const data = (await res.json()) as { success?: boolean; error?: string };

        if (res.ok && data.success) {
          setState("success");
          setEmail("");
        } else {
          setState("error");
          setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        }
      } catch {
        setState("error");
        setErrorMsg("Network error. Please try again.");
      }
    },
    [email],
  );

  if (state === "success") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-success"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          You are subscribed! Check your inbox on Monday.
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          You can unsubscribe at any time by replying &quot;unsubscribe&quot; to
          any digest email.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="shrink-0">
          <p className="text-sm font-medium text-foreground">
            Weekly Digest
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Get the top 10 articles every Monday — free, no spam.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full gap-2 sm:w-auto"
          noValidate
        >
          <label htmlFor="subscribe-email" className="sr-only">
            Email address
          </label>
          <input
            ref={inputRef}
            id="subscribe-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") {
                setState("idle");
                setErrorMsg("");
              }
            }}
            aria-invalid={state === "error" ? "true" : undefined}
            aria-describedby={
              state === "error" ? "subscribe-error" : "subscribe-gdpr"
            }
            className="min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="min-h-[44px] shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {state === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      </div>

      {state === "error" && errorMsg && (
        <p
          id="subscribe-error"
          role="alert"
          className="mt-2 text-xs text-destructive"
        >
          {errorMsg}
        </p>
      )}

      <p
        id="subscribe-gdpr"
        className="mt-2 text-[11px] leading-snug text-muted-foreground"
      >
        Your email is stored locally on this server — no third-party services.
        Unsubscribe any time.
      </p>
    </div>
  );
}
