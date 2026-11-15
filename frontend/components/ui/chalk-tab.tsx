"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ChalkCircle } from "@/components/ui/chalk-circle";
import { cn } from "@/lib/utils";

type ChalkTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  children: ReactNode;
  insetX?: number;
  insetY?: number;
};

/**
 * Shared selectable tab: focus and selection both use the same chalk ring.
 */
export function ChalkTab({
  active,
  children,
  className,
  insetX = 10,
  insetY = 5,
  onFocus,
  onBlur,
  ...props
}: ChalkTabProps) {
  const [focused, setFocused] = useState(false);

  return (
    <button
      type="button"
      {...props}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      className={cn(
        "relative outline-none focus-visible:outline-none",
        className,
      )}
    >
      <ChalkCircle active={active || focused} insetX={insetX} insetY={insetY} />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
