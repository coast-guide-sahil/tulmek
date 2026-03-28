"use client";

import { useState, useCallback } from "react";
import type { CategorizedItem } from "@tulmek/core/domain";
import { useProgress, useProgressActions } from "@/lib/progress/provider";
import { htmlToMarkdown } from "@/lib/progress/sanitize";

interface BulkActionsProps {
  readonly items: readonly CategorizedItem[];
  readonly selectedSlugs: ReadonlySet<string>;
  readonly onToggleSelect: (slug: string) => void;
  readonly onSelectAll: () => void;
  readonly onClearSelection: () => void;
  readonly isSelecting: boolean;
  readonly onToggleSelecting: () => void;
}

export function BulkActions({
  items,
  selectedSlugs,
  onSelectAll,
  onClearSelection,
  isSelecting,
  onToggleSelecting,
}: BulkActionsProps) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const progress = useProgress((s) => s.progress);
  const { getNote } = useProgressActions();

  const selectedCount = selectedSlugs.size;

  const generateExport = useCallback(async (): Promise<string> => {
    const selectedItems = items.filter((i) => selectedSlugs.has(i.slug));
    const parts: string[] = [];

    for (const item of selectedItems) {
      const note = await getNote(item.slug);
      const isCompleted = progress[item.slug]?.completed ?? false;
      const completedAt = progress[item.slug]?.completedAt;

      parts.push(
        [
          `# ${item.title}`,
          "",
          `- **Status:** ${isCompleted ? "Completed" : "Not started"}${completedAt ? ` (${new Date(completedAt).toLocaleDateString()})` : ""}`,
          item.url ? `- **URL:** ${item.url}` : null,
          `- **Category:** ${item.category.toUpperCase()}`,
          `- **Group:** ${item.group}`,
          item.difficulty ? `- **Difficulty:** ${item.difficulty}` : null,
          item.companies.length > 0
            ? `- **Companies:** ${item.companies.map((c) => `${c.name}${"★".repeat(c.frequency)}`).join(", ")}`
            : null,
          item.tags.length > 0
            ? `- **Tags:** ${item.tags.join(", ")}`
            : null,
          note?.trim()
            ? `\n## Notes\n\n${htmlToMarkdown(note)}`
            : null,
          "",
          "---",
          "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }

    return parts.join("\n");
  }, [items, selectedSlugs, progress, getNote]);

  const handleCopy = useCallback(async () => {
    setExporting(true);
    const md = await generateExport();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setExporting(false);
  }, [generateExport]);

  const handleDownload = useCallback(async () => {
    setExporting(true);
    const md = await generateExport();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tulmek-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }, [generateExport]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleSelecting}
        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
          isSelecting
            ? "bg-primary text-primary-foreground"
            : "border border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {isSelecting ? `${selectedCount} selected` : "Select"}
      </button>

      {isSelecting && (
        <>
          <button
            onClick={onSelectAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Select all
          </button>
          <button
            onClick={onClearSelection}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>

          {selectedCount > 0 && (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <button
                onClick={handleCopy}
                disabled={exporting}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                {copied ? "Copied!" : "Copy MD"}
              </button>
              <button
                onClick={handleDownload}
                disabled={exporting}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download .md
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
