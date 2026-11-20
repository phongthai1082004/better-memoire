"use client";

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Check,
  CircleNotch,
  Minus,
  Plus,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BookManifest } from "./api";
import type { PaperFormat } from "./paper";

export function StudioTopbar({
  book,
  format,
  zoom,
  dirty,
  saving,
  canUndo,
  canRedo,
  onZoom,
  onUndo,
  onRedo,
  onSave,
  onRename,
}: {
  book: BookManifest;
  format: PaperFormat;
  zoom: number;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onZoom: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(book.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const next = draft.trim();
    if (next && next !== book.title) onRename(next);
    else setDraft(book.title);
    setEditing(false);
  }

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between gap-3 border-b border-line-soft bg-board-deep px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/account"
          className="inline-flex h-9 items-center border border-line px-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-body transition-colors hover:border-yellow hover:text-yellow"
        >
          Account
        </Link>
        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
        <div className="min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") commit();
                if (event.key === "Escape") {
                  setDraft(book.title);
                  setEditing(false);
                }
              }}
              className="h-8 w-[12rem] border-b border-yellow bg-transparent text-[0.95rem] text-chalk outline-none sm:w-[18rem]"
              aria-label="Book title"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="block max-w-[12rem] truncate text-left text-[0.95rem] font-semibold text-chalk hover:text-yellow sm:max-w-[20rem]"
              title="Rename book"
            >
              {book.title}
            </button>
          )}
          <p className="font-mono text-[0.54rem] uppercase tracking-[0.11em] text-muted">
            {format.label} · {format.size} · {book.pageCount} pages
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          className="hidden h-8 w-8 place-items-center border border-line text-body hover:border-yellow hover:text-yellow disabled:opacity-35 sm:grid"
        >
          <ArrowCounterClockwise size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          className="hidden h-8 w-8 place-items-center border border-line text-body hover:border-yellow hover:text-yellow disabled:opacity-35 sm:grid"
        >
          <ArrowClockwise size={14} aria-hidden="true" />
        </button>

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        <button
          type="button"
          onClick={() => onZoom(zoom - 0.1)}
          aria-label="Zoom out"
          className="hidden h-8 w-8 place-items-center border border-line text-body hover:border-yellow hover:text-yellow sm:grid"
        >
          <Minus size={13} aria-hidden="true" />
        </button>
        <span className="hidden w-9 text-center font-mono text-[0.6rem] text-muted sm:block">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onZoom(zoom + 0.1)}
          aria-label="Zoom in"
          className="hidden h-8 w-8 place-items-center border border-line text-body hover:border-yellow hover:text-yellow sm:grid"
        >
          <Plus size={13} aria-hidden="true" />
        </button>

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        <span className="hidden items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted md:flex">
          {saving ? (
            <>
              <CircleNotch size={12} className="animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            <>
              <Check size={12} className="text-yellow" aria-hidden="true" />
              {dirty ? "Unsaved" : "Saved"}
            </>
          )}
        </span>

        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          className="btn btn-outline btn-sm h-8 px-2.5 text-[0.66rem] disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </header>
  );
}
