import { Suspense } from "react";
import { VerifyEmailForm } from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
