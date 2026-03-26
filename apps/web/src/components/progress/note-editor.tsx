"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useProgressActions } from "@/lib/progress/provider";
import { sanitizeHtml, htmlToMarkdown } from "@/lib/progress/sanitize";

const lowlight = createLowlight(common);

export function NoteEditor({ slug }: { slug: string }) {
  const [loaded, setLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [initialContent, setInitialContent] = useState("");
  const { getNote, saveNote } = useProgressActions();

  useEffect(() => {
    let cancelled = false;
    getNote(slug).then((note) => {
      if (!cancelled) {
        setInitialContent(note ?? "");
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [slug, getNote]);

  if (!loaded) {
    return <div className="h-20 animate-pulse rounded-lg bg-muted" aria-hidden />;
  }

  if (!isEditing && !initialContent.trim()) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        + Add notes
      </button>
    );
  }

  if (!isEditing) {
    return (
      <div className="group relative">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full rounded-lg border border-border bg-background p-3 text-left text-sm text-foreground transition-colors hover:border-primary"
        >
          <div
            className="tiptap-preview prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(initialContent) }}
          />
        </button>
        <NoteActions content={initialContent} slug={slug} />
      </div>
    );
  }

  return (
    <ActiveEditor
      slug={slug}
      initialContent={initialContent}
      onClose={(html) => {
        setInitialContent(html);
        setIsEditing(false);
      }}
      saveNote={saveNote}
    />
  );
}

function ActiveEditor({
  slug,
  initialContent,
  onClose,
  saveNote,
}: {
  slug: string;
  initialContent: string;
  onClose: (html: string) => void;
  saveNote: (slug: string, content: string) => Promise<void>;
}) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "Start typing your notes..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown,
    ],
    content: initialContent || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-sm sm:prose max-w-none dark:prose-invert focus:outline-none min-h-[120px] px-4 py-3",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(slug, e.getHTML()).catch(console.error);
      }, 1000);
    },
  });

  // Cleanup: flush pending save and destroy editor on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Flush the pending save so content isn't lost on unmount (e.g. group collapse)
        const html = editor?.getHTML();
        if (html !== undefined) {
          saveNote(slug, html).catch(console.error);
        }
      }
      editor?.destroy();
    };
  }, [editor, slug, saveNote]);

  const handleClose = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveNote(slug, html).catch(console.error);
    onClose(html);
  }, [editor, slug, saveNote, onClose]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border-2 border-primary bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
        <span className="text-xs text-muted-foreground">Auto-saves</span>
        <div className="flex items-center gap-2">
          <NoteActions
            content={editor.getHTML()}
            slug={slug}
            getMarkdown={() => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (editor as any).getMarkdown?.() ?? htmlToMarkdown(editor.getHTML());
              } catch {
                return htmlToMarkdown(editor.getHTML());
              }
            }}
          />
          <button
            onClick={handleClose}
            className="rounded px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold (Ctrl+B)">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 11h4.5a2.5 2.5 0 0 0 0-5H8v5Zm0 2v5h5a2.5 2.5 0 0 0 0-5H8ZM6 4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.5 4.5 0 0 1 13 20H6V4Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic (Ctrl+I)">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 20H7v-2h2.927l2.116-12H10V4h8v2h-2.927l-2.116 12H15v2Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Underline (Ctrl+U)">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 3v9a4 4 0 0 0 8 0V3h2v9a6 6 0 0 1-12 0V3h2ZM4 20h16v2H4v-2Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="Strikethrough">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.865-1.144V16.6c1.52.877 3.075 1.316 4.666 1.316 2.551 0 3.83-.732 3.839-2.197a2.21 2.21 0 0 0-.648-1.603l-.12-.116H3v-2h18v2h-3.846ZM7.556 11a2.62 2.62 0 0 1-.36-.738C7.065 9.86 7 9.428 7 8.972c0-1.304.532-2.347 1.595-3.13C9.658 5.113 11.044 4.723 12.752 4.723c1.507 0 2.958.318 4.353.953v2.19c-1.38-.74-2.833-1.109-4.353-1.109-1.2 0-2.144.225-2.833.674-.689.45-1.033 1.063-1.033 1.84 0 .554.155 1.01.466 1.372.108.125.222.24.343.346l.117.1H7.556Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} label="Highlight">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m15.243 4.515-6.738 6.737-.707 2.121-1.04 1.041 2.828 2.829 1.04-1.041 2.122-.707 6.737-6.738-4.242-4.242Zm6.364 3.535a1 1 0 0 1 0 1.414l-7.778 7.778-2.122.707L9.586 20.07l-5.657-5.657 2.122-2.121.707-2.122 7.778-7.778a1 1 0 0 1 1.414 0l5.657 5.657ZM4.929 19.071l1.414-1.414 1.414 1.414-1.414 1.414-1.414-1.414Z"/></svg>
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="Heading 2">
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="Heading 3">
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 4h13v2H8V4ZM5 3v3h1v1H3V6h1V4H3V3h2Zm-2 7h3.002v1H4v1h2v3H3v-1h2v-1H3v-3Zm2 11H3v-1h2v-1H3v-1h3v4H3v-1h2v-1ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} label="Task list">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m6 4 .735.676L3.804 7.964l-.99-.716L2 6.456l.938-.812.18.164L5.444 4H6Zm2.5 1.5h13v2h-13v-2Zm0 7h13v2h-13v-2Zm0 7h13v2h-13v-2ZM6 11l.735.676-2.931 3.288-.99-.716-.814-.792.938-.812.18.164L5.444 11H6Zm0 7 .735.676-2.931 3.288-.99-.716L2 20.456l.938-.812.18.164L5.444 18H6Z"/></svg>
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Blockquote">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15a3 3 0 0 1-3 3c-1.305 0-2.527-.724-3.417-1.679ZM16.583 17.321C15.553 16.227 15 15 15 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C21.591 11.69 23 13.166 23 15a3 3 0 0 1-3 3c-1.305 0-2.527-.724-3.417-1.679Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} label="Code block">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h16V5H4Zm16 7-3.536 3.536-1.414-1.414L17.172 12l-2.122-2.122 1.414-1.414L20 12ZM6.828 12l2.122 2.122-1.414 1.414L4 12l3.536-3.536 1.414 1.414L6.828 12Zm4.416 5H9.116l3.64-10h2.128l-3.64 10Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} label="Horizontal rule">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 11h2v2H2v-2Zm4 0h12v2H6v-2Zm14 0h2v2h-2v-2Z"/></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} label="Inline code">
        <span className="font-mono text-[10px]">`c`</span>
      </ToolbarButton>
    </div>
  );
}

function NoteActions({
  content,
  slug,
  getMarkdown,
}: {
  content: string;
  slug: string;
  getMarkdown?: () => string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      const md = getMarkdown ? getMarkdown() : htmlToMarkdown(content);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — ignore silently
    }
  }, [content, getMarkdown]);

  const handleDownload = useCallback(() => {
    const md = getMarkdown ? getMarkdown() : htmlToMarkdown(content);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, slug, getMarkdown]);

  if (!content?.trim()) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCopyMarkdown}
        className="inline-flex min-h-[44px] items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Copy as Markdown"
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            Copy MD
          </>
        )}
      </button>
      <button
        onClick={handleDownload}
        className="inline-flex min-h-[44px] items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Download as Markdown"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        .md
      </button>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
