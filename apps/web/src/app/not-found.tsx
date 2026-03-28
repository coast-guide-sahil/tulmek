import Link from "next/link";
import { APP_NAME } from "@tulmek/config/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-extrabold text-foreground">404</h1>
      <p className="mt-3 text-lg text-muted-foreground">Page not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/hub"
          className="min-h-[44px] rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Knowledge Hub
        </Link>
        <Link
          href="/progress"
          className="min-h-[44px] rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Practice
        </Link>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">{APP_NAME}</p>
    </div>
  );
}
