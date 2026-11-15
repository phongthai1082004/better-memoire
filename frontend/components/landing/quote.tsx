import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Quote({ copy }: { copy: Dictionary["quote"] }) {
  return (
    <section className="border-y border-line-soft py-[var(--section-y)]">
      <div className="page-shell">
        <Reveal className="mx-auto max-w-[52rem] text-center">
          <blockquote className="quote-hand">{copy.text}</blockquote>
          <svg
            aria-hidden="true"
            viewBox="0 0 120 12"
            className="mx-auto mt-8 h-3 w-28 text-coral/75"
          >
            <path
              d="M2 8Q22 1 42 7T82 6T118 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="hand mt-4 text-[1.12rem] text-muted">
            <span aria-hidden="true" className="mr-2 text-coral">
              —
            </span>
            {copy.attribution}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
