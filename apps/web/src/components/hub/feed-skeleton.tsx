export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search bar skeleton */}
      <div className="flex gap-4">
        <div className="h-11 flex-1 skeleton-shimmer rounded-lg" />
        <div className="h-11 w-24 skeleton-shimmer rounded-lg" />
      </div>

      {/* Category nav skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-11 w-24 skeleton-shimmer rounded-lg" />
        ))}
      </div>

      {/* Sort tabs skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-72 skeleton-shimmer rounded-lg" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 skeleton-shimmer rounded" />
              <div className="h-4 w-12 skeleton-shimmer rounded" />
            </div>
            <div className="h-5 w-full skeleton-shimmer rounded" />
            <div className="h-5 w-3/4 skeleton-shimmer rounded" />
            <div className="h-4 w-full skeleton-shimmer rounded" />
            <div className="mt-auto flex items-center gap-2 pt-2">
              <div className="h-5 w-16 skeleton-shimmer rounded-full" />
              <div className="h-4 w-12 skeleton-shimmer rounded" />
              <div className="ml-auto h-4 w-12 skeleton-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
