"use client";

import { useState } from "react";
import { ChalkCircle } from "@/components/ui/chalk-circle";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Option = Dictionary["options"]["items"][number];

export function FormatOption({
  option,
  index,
  selected,
  onSelect,
}: {
  option: Option;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <li className="mt-2 first:mt-0">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "group relative grid w-full grid-cols-[2.6rem_1fr_auto] items-start gap-3 border border-transparent px-3 py-4 text-left outline-none transition-colors focus-visible:outline-none sm:grid-cols-[3.1rem_1fr_auto] sm:gap-4 sm:px-4",
          selected
            ? "bg-white/[0.05] text-chalk"
            : "text-body hover:bg-white/[0.025] hover:text-chalk",
        )}
      >
        <span
          className={cn(
            "hand relative z-10 mt-0.5 flex h-10 w-10 items-center justify-center text-[1.65rem] leading-none",
            selected ? "text-yellow" : "text-muted group-hover:text-chalk",
          )}
        >
          <ChalkCircle active={selected || focused} insetX={14} insetY={14} />
          <span className="relative z-10">{String(index + 1).padStart(2, "0")}</span>
        </span>
        <span className="relative z-10 min-w-0">
          <span className="block text-[1.14rem] font-semibold text-chalk">
            {option.name}
          </span>
          <span className="mt-0.5 block max-w-[40ch] overflow-hidden text-[0.92rem] leading-relaxed text-ellipsis whitespace-nowrap text-muted">
            {option.note}
          </span>
        </span>
        <span className="relative z-10 pt-0.5 font-mono text-[0.76rem] uppercase tracking-[0.08em] text-muted">
          {option.size}
        </span>
      </button>
    </li>
  );
}
