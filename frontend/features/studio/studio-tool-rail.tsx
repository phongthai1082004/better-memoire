"use client";

import {
  Drop,
  FrameCorners,
  ImageSquare,
  Shapes,
  SlidersHorizontal,
  SquaresFour,
  StackSimple,
  TextT,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { StudioTool } from "./store";

const TOOLS: {
  id: StudioTool;
  label: string;
  icon: typeof SquaresFour;
  disabled?: boolean;
}[] = [
  { id: "layouts", label: "Layouts", icon: SquaresFour },
  { id: "photos", label: "Photos", icon: ImageSquare },
  { id: "text", label: "Text", icon: TextT },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "frames", label: "Frames", icon: FrameCorners },
  { id: "filter", label: "Filter", icon: SlidersHorizontal },
  { id: "background", label: "Background", icon: Drop },
  { id: "layers", label: "Layers", icon: StackSimple },
];

export function StudioToolRail({
  tool,
  onTool,
}: {
  tool: StudioTool;
  onTool: (tool: StudioTool) => void;
}) {
  return (
    <nav
      aria-label="Studio tools"
      className="no-scrollbar flex w-full shrink-0 overflow-x-auto border-b border-line-soft bg-board-deep/70 lg:w-auto lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r"
    >
      {TOOLS.map(({ id, label, icon: Icon, disabled }) => {
        const active = tool === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (!disabled) onTool(id);
            }}
            disabled={disabled}
            title={label}
            aria-label={label}
            aria-pressed={disabled ? undefined : active}
            aria-disabled={disabled}
            className={cn(
              "relative grid h-12 w-12 shrink-0 place-items-center border-b border-line-soft text-body transition-colors lg:h-16 lg:w-16",
              disabled
                ? "cursor-not-allowed text-muted/45"
                : active
                  ? "bg-yellow/10 text-yellow"
                  : "hover:bg-white/[0.03] hover:text-chalk",
            )}
          >
            <Icon size={19} weight={active && !disabled ? "fill" : "regular"} aria-hidden="true" />
            {disabled && (
              <span className="absolute bottom-1 font-mono text-[0.38rem] uppercase tracking-[0.08em] text-muted/70">
                N/A
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
