"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { FormatOption } from "@/components/landing/format-option";
import { Polaroid } from "@/components/ui/polaroid";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const visuals = {
  pocket: { src: "/images/mood-window.webp", altKey: "moodWindow" },
  "square-small": { src: "/images/first-year.webp", altKey: "firstYear" },
  square: { src: "/images/wedding-hands.webp", altKey: "weddingHands" },
  portrait: { src: "/images/hero-portrait.webp", altKey: "heroPortrait" },
  a4: { src: "/images/library.webp", altKey: "library" },
  landscape: { src: "/images/paper-stack.webp", altKey: "paperStack" },
} as const;

export function Options({
  copy,
  images,
  startHref,
}: {
  copy: Dictionary["options"];
  images: Dictionary["images"];
  startHref: string;
}) {
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const item = copy.items[active] ?? copy.items[0];
  const visual = visuals[item.id as keyof typeof visuals] ?? visuals.square;

  function select(index: number) {
    setActive(index);
    setFlipped(false);
  }

  return (
    <section id="options" className="scroll-mt-28 py-[var(--section-y)]">
      <div className="page-shell">
        <div className="grid gap-7 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 className="h-section mt-3 max-w-[14ch]">{copy.title}</h2>
          </div>
          <p className="max-w-[38rem] text-[1.06rem] leading-relaxed text-body lg:pb-1">
            {copy.intro}
          </p>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.08fr_0.82fr] lg:items-start lg:gap-16">
          <ol className="pt-1">
            {copy.items.map((entry, index) => {
              const previous = copy.items[index - 1];
              const startsGroup = !previous || previous.group !== entry.group;

              return (
                <Fragment key={entry.id}>
                  {startsGroup && (
                    <li className="pb-2 pt-7 font-display text-[0.78rem] uppercase tracking-[0.18em] text-muted first:pt-0">
                      {entry.group}
                    </li>
                  )}
                  <FormatOption
                    option={entry}
                    index={index}
                    selected={index === active}
                    onSelect={() => select(index)}
                  />
                </Fragment>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-28">
            <div className="h-[34rem] [perspective:1600px]">
              <div
                className={cn(
                  "relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] motion-reduce:transition-none",
                  flipped && "[transform:rotateY(180deg)]",
                )}
              >
                <div
                  aria-hidden={flipped}
                  className="absolute inset-0 flex flex-col [backface-visibility:hidden]"
                >
                  <Polaroid
                    src={visual.src}
                    alt={images[visual.altKey as keyof Dictionary["images"]]}
                    aspect="wide"
                    tilt={-1.3}
                    sizes="(min-width: 1024px) 34vw, 90vw"
                  />

                  <div className="mt-6">
                    <div className="flex items-baseline gap-3">
                      <span className="hand text-[3.1rem] leading-none text-yellow">
                        {String(active + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-[2.2rem] uppercase leading-none tracking-[0.08em] text-chalk">
                        {item.name}
                      </h3>
                    </div>
                    <p className="hand mt-3 overflow-hidden text-[1.42rem] leading-snug text-ellipsis whitespace-nowrap text-body">
                      {item.note}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFlipped(true)}
                        tabIndex={flipped ? -1 : undefined}
                        className="link-hand inline-flex items-center gap-2 text-[1.08rem]"
                      >
                        <ArrowsClockwise size={14} weight="bold" aria-hidden="true" />
                        {copy.flip}
                      </button>
                      <Link
                        href={startHref}
                        tabIndex={flipped ? -1 : undefined}
                        className="link-hand text-[1.08rem]"
                      >
                        {copy.cta}
                      </Link>
                    </div>
                  </div>
                </div>

                <div
                  aria-hidden={!flipped}
                  className="option-card__back panel-outline absolute inset-0 flex flex-col p-5 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-6"
                >
                  <div className="flex items-baseline gap-3 border-b border-dashed border-line pb-4">
                    <span className="hand text-[1.7rem] text-yellow">
                      {String(active + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-[2.2rem] uppercase tracking-[0.08em] text-chalk">
                      {item.name}
                    </h3>
                  </div>

                  <dl className="mt-5">
                    {[
                      [copy.labels.format, item.size],
                      [copy.labels.pages, item.pages],
                      [copy.labels.paper, item.paper],
                      [copy.labels.cover, item.cover],
                      [copy.labels.delivery, item.delivery],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-[7rem_1fr] gap-3 border-b border-dashed border-line py-2.5 text-[0.86rem]"
                      >
                        <dt className="text-muted">{label}</dt>
                        <dd className="text-chalk">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5">
                    <p className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-muted">
                      {copy.labels.honestly}
                    </p>
                    <p className="hand mt-2 text-[1.35rem] leading-snug text-coral">
                      {item.honest}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() => setFlipped(false)}
                      tabIndex={flipped ? undefined : -1}
                      className="btn btn-outline btn-sm"
                    >
                      <ArrowsClockwise size={13} weight="bold" aria-hidden="true" />
                      {copy.flipBack}
                    </button>
                    <Link
                      href={startHref}
                      tabIndex={flipped ? undefined : -1}
                      className="link-hand text-[0.95rem]"
                    >
                      {copy.cta}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
