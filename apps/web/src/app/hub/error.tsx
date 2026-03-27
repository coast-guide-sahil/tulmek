"use client";

export default function HubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An error occurred while loading the Knowledge Hub. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-[44px] rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
