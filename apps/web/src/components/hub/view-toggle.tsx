"use client";

interface ViewToggleProps {
  readonly layout: "grid" | "list";
  readonly onChange: (layout: "grid" | "list") => void;
}

export function ViewToggle({ layout, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-border" role="radiogroup" aria-label="View layout">
      <button
        onClick={() => onChange("grid")}
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-l-lg transition-colors ${
          layout === "grid"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        role="radio"
        aria-checked={layout === "grid"}
        aria-label="Grid view"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </button>
      <button
        onClick={() => onChange("list")}
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-r-lg border-l border-border transition-colors ${
          layout === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        role="radio"
        aria-checked={layout === "list"}
        aria-label="List view"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      </button>
    </div>
  );
}
