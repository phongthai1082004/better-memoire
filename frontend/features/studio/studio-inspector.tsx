"use client";

import {
  CaretDown,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextItalic,
  TextUnderline,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { BookManifest } from "./api";
import type { ImageFilterPreset } from "./fabric-canvas";
import type { PaperFormat } from "./paper";
import type { StudioSelection } from "./store";

const FONTS = ["Alegreya Sans", "Cormorant SC", "Georgia", "Garamond", "Courier New"];
const COLORS = ["#2b2f36", "#f3f2ea", "#b54843", "#b08a3e", "#4f6b5d", "#315b7a"];
const FILTERS: { id: ImageFilterPreset; label: string }[] = [
  { id: "none", label: "Original" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "mono", label: "B&W" },
  { id: "fade", label: "Fade" },
  { id: "vivid", label: "Vivid" },
];

export function StudioInspector({
  book,
  format,
  selection,
  pageVersion,
  background,
  onUpdate,
  onFilter,
}: {
  book: BookManifest;
  format: PaperFormat;
  selection: StudioSelection;
  pageVersion: number;
  background: string;
  onUpdate: (patch: Record<string, unknown>) => void;
  onFilter: (preset: ImageFilterPreset) => void;
}) {
  const [size, setSize] = useState(String(selection?.fontSize ?? 24));

  return (
    <aside className="hidden min-h-0 w-[300px] min-w-[300px] max-w-[300px] shrink-0 overflow-y-auto border-l border-line-soft bg-board-deep/50 lg:block">
      <div className="border-b border-line-soft px-4 py-4">
        <p className="font-display text-[0.66rem] uppercase tracking-[0.2em] text-muted">
          Inspector
        </p>
      </div>

      {selection ? (
        <div className="p-4">
          <div className="border border-line-soft p-4">
            <p className="text-[0.64rem] uppercase tracking-[0.14em] text-muted">
              Selected
            </p>
            <p className="mt-1 hand text-[1.7rem] capitalize leading-none text-chalk">
              {selection.type}
            </p>
            <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.1em] text-muted">
              {selection.id.slice(0, 8)}
            </p>
          </div>

          {selection.isText && (
            <div className="mt-4 space-y-4">
              <label className="block text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                Typeface
                <span className="relative mt-1.5 block">
                  <select
                    value={selection.fontFamily}
                    onChange={(event) => onUpdate({ fontFamily: event.target.value })}
                    className="h-9 w-full appearance-none border border-line bg-board px-2 pr-8 text-[0.78rem] normal-case tracking-normal text-chalk outline-none focus:border-yellow"
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={12}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                </span>
              </label>

              <label className="block text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                Size
                <input
                  type="number"
                  min={8}
                  max={200}
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  onBlur={() => {
                    const value = Math.max(8, Math.min(200, Number(size) || 24));
                    setSize(String(value));
                    onUpdate({ fontSize: value });
                  }}
                  className="mt-1.5 h-9 w-full border border-line bg-board px-2 text-[0.82rem] tracking-normal text-chalk outline-none focus:border-yellow"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                  Letter spacing
                  <input
                    type="number"
                    step={10}
                    min={-100}
                    max={1000}
                    value={selection.charSpacing ?? 0}
                    onChange={(event) =>
                      onUpdate({ charSpacing: Number(event.target.value) || 0 })
                    }
                    className="mt-1.5 h-9 w-full border border-line bg-board px-2 text-[0.82rem] tracking-normal text-chalk outline-none focus:border-yellow"
                  />
                </label>
                <label className="block text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                  Line height
                  <input
                    type="number"
                    step={0.1}
                    min={0.8}
                    max={3}
                    value={selection.lineHeight ?? 1.2}
                    onChange={(event) =>
                      onUpdate({ lineHeight: Number(event.target.value) || 1.2 })
                    }
                    className="mt-1.5 h-9 w-full border border-line bg-board px-2 text-[0.82rem] tracking-normal text-chalk outline-none focus:border-yellow"
                  />
                </label>
              </div>

              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">Style</p>
                <div className="mt-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({ fontWeight: selection.fontWeight === "bold" ? "normal" : "bold" })
                    }
                    aria-pressed={selection.fontWeight === "bold"}
                    className={`grid h-9 flex-1 place-items-center border text-[0.82rem] font-bold ${selection.fontWeight === "bold" ? "border-yellow text-yellow" : "border-line text-body"}`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({ fontStyle: selection.fontStyle === "italic" ? "normal" : "italic" })
                    }
                    aria-pressed={selection.fontStyle === "italic"}
                    className={`grid h-9 flex-1 place-items-center border ${selection.fontStyle === "italic" ? "border-yellow text-yellow" : "border-line text-body"}`}
                  >
                    <TextItalic size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ underline: !selection.underline })}
                    aria-pressed={selection.underline}
                    className={`grid h-9 flex-1 place-items-center border ${selection.underline ? "border-yellow text-yellow" : "border-line text-body"}`}
                  >
                    <TextUnderline size={15} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">Align</p>
                <div className="mt-1.5 flex gap-1">
                  {[
                    { value: "left", icon: TextAlignLeft },
                    { value: "center", icon: TextAlignCenter },
                    { value: "right", icon: TextAlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onUpdate({ textAlign: value })}
                      aria-pressed={selection.textAlign === value}
                      className={`grid h-9 flex-1 place-items-center border ${selection.textAlign === value ? "border-yellow text-yellow" : "border-line text-body"}`}
                    >
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">Colour</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdate({ fill: color })}
                      aria-label={`Text colour ${color}`}
                      className={`h-7 w-7 border ${selection.fill.toLowerCase() === color ? "border-yellow ring-1 ring-yellow" : "border-line"}`}
                      style={{ background: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(selection.fill) ? selection.fill : "#2b2f36"}
                    onChange={(event) => onUpdate({ fill: event.target.value })}
                    aria-label="Custom text colour"
                    className="h-7 w-9 cursor-pointer border border-line bg-transparent p-0.5"
                  />
                </div>
              </div>
            </div>
          )}

          {selection.isImage && (
            <div className="mt-4">
              <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">Filter</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => onFilter(filter.id)}
                    className="border border-line px-2 py-2 text-[0.68rem] text-body transition-colors hover:border-yellow hover:text-yellow"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-[0.64rem] uppercase tracking-[0.12em] text-muted">
                Opacity
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  defaultValue={1}
                  onChange={(event) => onUpdate({ opacity: Number(event.target.value) })}
                  className="mt-2 w-full accent-[var(--yellow)]"
                />
              </label>
            </div>
          )}

          {!selection.isText && !selection.isImage && (
            <p className="mt-4 text-[0.76rem] leading-relaxed text-muted">
              Drag to move. Pull a corner to resize. Rotate from the top handle.
            </p>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="border border-dashed border-line-soft p-4">
            <p className="hand text-[1.5rem] leading-tight text-chalk">Nothing selected</p>
            <p className="mt-2 text-[0.76rem] leading-relaxed text-muted">
              Choose an object on the page to edit it, or use a tool on the left to add
              something.
            </p>
          </div>

          <div className="mt-4 space-y-2 border border-line-soft p-4 text-[0.74rem] text-muted">
            <div className="flex justify-between gap-3">
              <span>Format</span>
              <span className="text-body">{format.label}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Paper</span>
              <span className="font-mono text-body">{format.size}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Page</span>
              <span className="font-mono text-body">v{pageVersion}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Background</span>
              <span className="font-mono text-body">{background}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Book</span>
              <span className="max-w-[12ch] truncate text-right text-body">{book.title}</span>
            </div>
          </div>

          <p className="mt-4 text-[0.72rem] leading-relaxed text-muted">
            Delete removes the selection. Ctrl/Cmd + D duplicates. Ctrl/Cmd + Z undoes.
          </p>
        </div>
      )}
    </aside>
  );
}
