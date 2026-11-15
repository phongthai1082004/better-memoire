"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function AccountSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="field-input flex w-full items-center justify-between gap-3 text-left"
      >
        <span>{current?.label}</span>
        <CaretDown
          size={14}
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="panel panel-outline absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[0.86rem] transition-colors hover:bg-white/[0.06] hover:text-yellow",
                option.value === value ? "text-yellow" : "text-body",
              )}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
