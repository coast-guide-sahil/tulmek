"use client";

/**
 * Root-level error boundary — catches errors in the root layout itself.
 * Must provide its own <html> and <body> since the root layout may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#09090b", color: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: "16px", textAlign: "center" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ marginTop: "12px", color: "#a1a1aa" }}>
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p style={{ marginTop: "8px", fontSize: "12px", color: "#71717a" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "24px",
              padding: "10px 24px",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
