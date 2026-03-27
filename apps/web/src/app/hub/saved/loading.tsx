import { FeedSkeleton } from "@/components/hub/feed-skeleton";

export default function SavedLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 skeleton-shimmer rounded" />
        <div className="h-5 w-24 skeleton-shimmer rounded" />
      </div>
      <FeedSkeleton />
    </div>
  );
}
