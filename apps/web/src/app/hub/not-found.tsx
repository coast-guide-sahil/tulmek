import Link from "next/link";

export default function HubNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist. Try searching the Knowledge Hub
        or browse the latest articles.
      </p>
      <Link
        href="/hub"
        className="mt-6 min-h-[44px] rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to Knowledge Hub
      </Link>
    </div>
  );
}
