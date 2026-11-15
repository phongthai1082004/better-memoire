"use client";

import { cn } from "@/lib/utils";

/**
 * Hand-drawn selection ring. The path starts at the top and runs clockwise;
 * increasing stroke-dashoffset un-draws it back toward the start, while
 * decreasing it to zero draws the ring clockwise.
 */
export function ChalkCircle({
  active,
  insetX = 0,
  insetY = 0,
  className,
}: {
  active: boolean;
  insetX?: number;
  insetY?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-0 overflow-visible text-yellow",
        className,
      )}
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
      style={{
        top: -insetY,
        left: -insetX,
        width: `calc(100% + ${insetX * 2}px)`,
        height: `calc(100% + ${insetY * 2}px)`,
      }}
    >
      <path
        d="M 50 3 C 76 3, 96 11, 96 25 C 96 39, 76 47, 50 47 C 24 47, 4 39, 4 25 C 4 11, 24 3, 50 3"
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        className="chalk-circle-path"
        style={{
          strokeDashoffset: active ? 0 : 1,
          strokeOpacity: active ? 1 : 0,
          transition: `stroke-dashoffset 360ms cubic-bezier(0.22, 0.8, 0.28, 1), stroke-opacity 0s linear ${active ? "0s" : "360ms"}`,
        }}
      />
    </svg>
  );
}
