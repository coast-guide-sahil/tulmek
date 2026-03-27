import { FeedSkeleton } from "@/components/hub/feed-skeleton";

export default function HubLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
      <div className="h-5 w-64 skeleton-shimmer rounded" />
      <FeedSkeleton />
    </div>
  );
}
