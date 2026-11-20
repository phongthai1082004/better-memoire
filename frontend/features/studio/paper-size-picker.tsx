"use client";

import { ArrowLeft, ArrowRight, Check, CircleNotch } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { cn } from "@/lib/utils";
import { listBooks, type BookManifest } from "./api";
import { PAPER_FORMATS, type PaperFormatKey } from "./paper";
import { useStudioStore } from "./store";

export function PaperSizePicker() {
  const router = useRouter();
  const createBook = useStudioStore((state) => state.createBook);
  const [selected, setSelected] = useState<PaperFormatKey>("A4");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<BookManifest[]>([]);

  useEffect(() => {
    let active = true;
    void listBooks()
      .then((items) => {
        if (active) setBooks(items.slice(0, 4));
      })
      .catch(() => {
        // The new-book flow still works when the book list is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  async function start() {
    const format = PAPER_FORMATS[selected];
    setCreating(true);
    setError(null);
    try {
      const bookId = await createBook(selected, format.widthMm, format.heightMm);
      router.replace(`/studio?bookId=${bookId}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not start a book.");
      setCreating(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-board">
      <header className="flex h-20 items-center justify-between border-b border-line-soft bg-board-deep px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 border border-line px-3 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-body transition-colors hover:border-yellow hover:text-yellow"
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Brand />
        </div>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
          New book · step 1 of 2
        </span>
      </header>

      <div className="page-shell py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">Before we lay out a page</p>
          <h1 className="hand mt-3 text-[clamp(2.8rem,6vw,5rem)] leading-[0.98] text-chalk">
            Choose the paper.
          </h1>
          <p className="mt-4 max-w-[48ch] text-body">
            Every measurement in the studio follows this page. You can choose a new size
            for a new book, but an existing book keeps the paper it was made with.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {(Object.keys(PAPER_FORMATS) as PaperFormatKey[]).map((key) => {
              const format = PAPER_FORMATS[key];
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "group relative border p-5 text-left transition-colors",
                    active
                      ? "border-yellow bg-white/[0.045]"
                      : "border-line bg-board-deep/30 hover:border-line",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                        Paper size
                      </p>
                      <p className="mt-2 hand text-[2.7rem] leading-none text-chalk">
                        {format.label}
                      </p>
                      <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-yellow">
                        {format.size}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full border",
                        active
                          ? "border-yellow bg-yellow text-yellow-ink"
                          : "border-line text-transparent",
                      )}
                    >
                      <Check size={14} weight="bold" aria-hidden="true" />
                    </span>
                  </div>

                  <p className="mt-5 text-[0.82rem] leading-relaxed text-muted">
                    {format.note}
                  </p>

                  <div className="mt-5 flex items-end gap-2">
                    <span
                      className="block border border-line bg-paper shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                      style={{
                        width: key === "A4" ? 50 : 44,
                        height: key === "A4" ? 70 : 62,
                      }}
                    />
                    <span className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                      Portrait
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mt-5 text-[0.86rem] text-coral">
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-6">
            <p className="max-w-[38ch] text-[0.76rem] leading-relaxed text-muted">
              A4 is 210 × 297 mm. A5 is 148 × 210 mm. Both are portrait for now.
            </p>
            <button
              type="button"
              onClick={() => void start()}
              disabled={creating}
              className="btn btn-solid btn-lg group disabled:opacity-60"
            >
              {creating ? (
                <>
                  <CircleNotch size={15} className="animate-spin" aria-hidden="true" />
                  Preparing the book
                </>
              ) : (
                <>
                  Continue with {PAPER_FORMATS[selected].label}
                  <ArrowRight
                    size={15}
                    weight="bold"
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </div>

          {books.length > 0 && (
            <div className="mt-12 border-t border-line-soft pt-7">
              <p className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-muted">
                Continue an existing book
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/studio?bookId=${book.id}`}
                    className="flex items-center justify-between gap-4 border border-line-soft px-4 py-3 text-left transition-colors hover:border-yellow"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.84rem] text-chalk">
                        {book.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                        {book.paperWidth === 148 ? "A5" : "A4"} · {book.pageCount} pages
                      </span>
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-yellow" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
