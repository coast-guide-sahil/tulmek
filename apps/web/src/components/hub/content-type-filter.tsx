"use client";

type ContentType = "all" | "articles" | "videos" | "discussions";

interface ContentTypeFilterProps {
  readonly value: ContentType;
  readonly onChange: (type: ContentType) => void;
  readonly counts: Record<ContentType, number>;
}

const TYPES: { id: ContentType; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "" },
  { id: "articles", label: "Articles", icon: "📄" },
  { id: "videos", label: "Videos", icon: "🎥" },
  { id: "discussions", label: "Discussions", icon: "💬" },
];

export function ContentTypeFilter({ value, onChange, counts }: ContentTypeFilterProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Content type">
      {TYPES.map((type) => {
        const count = counts[type.id];
        if (type.id !== "all" && count === 0) return null;
        return (
          <button
            key={type.id}
            role="tab"
            aria-selected={value === type.id}
            onClick={() => onChange(type.id)}
            className={`min-h-[44px] rounded-md px-3 text-xs font-medium transition-colors sm:text-sm ${
              value === type.id
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {type.icon && <span className="mr-1">{type.icon}</span>}
            {type.label}
            <span className="ml-1 text-xs opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { ContentType };
