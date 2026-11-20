"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";
import { ChalkTab } from "@/components/ui/chalk-tab";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function Books({
  copy,
  startHref,
}: {
  copy: Dictionary["books"];
  startHref: string;
}) {
  const [active, setActive] = useState(0);
  const item = copy.items[active] ?? copy.items[0];

  return (
    <section
      id="books"
      className="scroll-mt-28 py-[var(--section-y)]"
    >
      <div className="page-shell">
        <Reveal className="vignette-panel panel panel-outline px-6 py-9 sm:px-9 md:px-12 md:py-12">
          <div className="grid gap-7 lg:grid-cols-[1fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h2 className="h-section mt-3 max-w-[16ch]">{copy.title}</h2>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={copy.eyebrow}
            className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-dashed border-line pb-5"
          >
            {copy.items.map((entry, index) => (
              <ChalkTab
                key={entry.title}
                role="tab"
                aria-selected={index === active}
                active={index === active}
                onClick={() => setActive(index)}
                insetX={10}
                insetY={5}
                className={cn(
                  "hand px-3.5 py-1.5 text-[1.3rem] leading-none transition-colors",
                  index === active ? "text-yellow" : "text-muted hover:text-chalk",
                )}
              >
                {entry.title}
              </ChalkTab>
            ))}
          </div>

          <p className="mt-4 text-[0.86rem] leading-relaxed text-muted">
            {copy.tabsNote}
          </p>

          <div className="mt-8 grid gap-7 border-y border-dashed border-line py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {copy.facts.map((fact, index) => (
              <div
                key={fact.label}
                className={cn(
                  "lg:px-6",
                  index > 0 && "lg:border-l lg:border-dashed lg:border-line",
                  index === 0 && "lg:pl-0",
                  index === copy.facts.length - 1 && "lg:pr-0",
                )}
              >
                <p className="font-display text-[0.72rem] uppercase tracking-[0.17em] text-muted">
                  {fact.label}
                </p>
                <p className="hand mt-2 text-[2.75rem] leading-none text-chalk">
                  {fact.value}
                </p>
                <p className="mt-2 max-w-[18ch] text-[0.87rem] leading-relaxed text-body">
                  {fact.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-[34rem]">
              <p className="chalk-grain hand text-[1.9rem] leading-[1.3] text-chalk sm:text-[2.12rem]">
                {item.note}
              </p>
              <p className="hand mt-3 text-[1.08rem] text-muted">
                <span aria-hidden="true" className="mr-2 text-coral">
                  —
                </span>
                {copy.signature}
              </p>
            </div>
            <Link
              href={startHref}
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "group shrink-0",
              })}
            >
              {copy.cta}
              <ArrowRight
                size={14}
                weight="bold"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
