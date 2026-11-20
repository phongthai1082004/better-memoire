"use client";

import { Copy, Plus, Trash } from "@phosphor-icons/react";
import type { BookManifest } from "./api";
import { cn } from "@/lib/utils";

type PageStripProps = {
  book: BookManifest;
  activePageId: string | null;
  dirty: Record<string, boolean>;
  busy: boolean;
  onSelect: (pageId: string) => void;
  onAdd: () => void;
  onDuplicate: (pageIds: string[]) => void;
  onDelete: (pageIds: string[]) => void;
};

export function PageStrip({
  book,
  activePageId,
  dirty,
  busy,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: PageStripProps) {
  const pages = [...book.pages].sort((a, b) => a.position - b.position);
  const spreads: (typeof pages)[] = [];
  for (let index = 0; index < pages.length; index += 2) {
    spreads.push(pages.slice(index, index + 2));
  }

  return (
    <footer className="h-[118px] shrink-0 border-t border-line-soft bg-board-deep/80">
      <div className="flex h-full items-stretch">
        <div className="flex w-[104px] shrink-0 flex-col justify-center gap-2 border-r border-line-soft px-3">
          <p className="font-display text-[0.6rem] uppercase tracking-[0.16em] text-muted">
            Spreads
          </p>
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            className="inline-flex h-7 items-center justify-center gap-1 border border-line text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-body transition-colors hover:border-yellow hover:text-yellow disabled:opacity-40"
          >
            <Plus size={11} weight="bold" aria-hidden="true" />
            Add 2
          </button>
        </div>

        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto px-3 py-2">
          {spreads.map((spread) => {
            const ids = spread.map((page) => page.id);
            const active = ids.includes(activePageId ?? "");
            const unsaved = spread.some((page) => dirty[page.id]);
            const first = spread[0];
            const last = spread[spread.length - 1];
            const canRemove = pages.length - spread.length >= 2 && spread.length === 2;

            return (
              <div
                key={first.id}
                className={cn(
                  "flex h-full w-[214px] shrink-0 items-center gap-2 border p-2",
                  active
                    ? "border-yellow bg-white/[0.04]"
                    : "border-line-soft hover:border-line",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(active ? (activePageId ?? first.id) : first.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="flex h-[58px] w-[62px] shrink-0 overflow-hidden border border-line bg-paper">
                    {spread.map((page) => (
                      <span
                        key={page.id}
                        className={cn(
                          "grid h-full flex-1 place-items-center border-r border-line/50 font-mono text-[0.55rem] last:border-r-0",
                          "text-[#2b2f36]",
                          page.id === activePageId && "bg-[#e8dfc8]",
                        )}
                      >
                        {page.position + 1}
                      </span>
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-body">
                      {spread.length === 2
                        ? `Pages ${first.position + 1}–${last.position + 1}`
                        : `Page ${first.position + 1}`}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.52rem] uppercase tracking-[0.05em] text-muted">
                      {spread
                        .map((page) => `p${page.position + 1} v${page.version}`)
                        .join(" · ")}
                      {unsaved ? " · unsaved" : ""}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => onDuplicate(ids)}
                    aria-label={spread.length === 2 ? "Duplicate spread" : "Duplicate page"}
                    className="grid h-5 w-5 place-items-center text-muted hover:text-yellow"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(ids)}
                    disabled={busy || !canRemove}
                    aria-label={spread.length === 2 ? "Delete spread" : "Delete page"}
                    className="grid h-5 w-5 place-items-center text-muted hover:text-coral disabled:opacity-25"
                  >
                    <Trash size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
