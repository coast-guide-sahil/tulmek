export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      {/* Title skeleton */}
      <div className="h-8 w-56 skeleton-shimmer rounded-lg" />
      <div className="h-5 w-80 skeleton-shimmer rounded" />

      {/* Section cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="h-5 w-20 skeleton-shimmer rounded" />
            <div className="mt-3 h-8 w-16 skeleton-shimmer rounded" />
            <div className="mt-2 h-3 w-full skeleton-shimmer rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 skeleton-shimmer rounded-lg" />
        ))}
      </div>
    </div>
  );
}
