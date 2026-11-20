"use client";

import {
  ArrowDown,
  ArrowUp,
  CaretDown,
  CaretRight,
  Check,
  Eye,
  EyeSlash,
  Lock,
  LockOpen,
  Plus,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { r2Thumb } from "@/lib/media";
import type { ImageFilterPreset, StudioCanvasHandle, StudioLayer } from "./fabric-canvas";
import { listStudioImages, uploadStudioImage, type StudioUserImage } from "./api";
import { layoutsForPages, type LayoutDefinition } from "./layouts";
import type { StudioTool } from "./store";

const PHOTOS = [
  { src: "/images/hero-polaroids.webp", label: "Summer table" },
  { src: "/images/hero-portrait.webp", label: "A quiet portrait" },
  { src: "/images/first-year.webp", label: "First year" },
  { src: "/images/wedding-hands.webp", label: "Hands" },
  { src: "/images/mood-window.webp", label: "Window light" },
  { src: "/images/library.webp", label: "Library" },
  { src: "/images/paper-stack.webp", label: "Paper stack" },
  { src: "/images/craft-camera.webp", label: "The camera" },
];

const BACKGROUNDS = [
  "#f3f2ea",
  "#ece5d5",
  "#d8d0be",
  "#2b2f36",
  "#dfe3dc",
  "#e9d8c8",
  "#f1e4e2",
  "#e7e0cf",
];

const GRADIENTS = [
  "linear-gradient(135deg, #f3f2ea 0%, #d8d0be 100%)",
  "linear-gradient(160deg, #f1e4e2 0%, #d8c5c0 100%)",
  "linear-gradient(145deg, #e7e0cf 0%, #b9c2b4 100%)",
  "linear-gradient(180deg, #2b2f36 0%, #47515d 100%)",
];

const FILTERS: { id: ImageFilterPreset; label: string }[] = [
  { id: "none", label: "Original" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "mono", label: "Black & white" },
  { id: "fade", label: "Faded" },
  { id: "vivid", label: "Vivid" },
];

type PanelProps = {
  tool: StudioTool;
  canvasRef: RefObject<StudioCanvasHandle | null>;
  pageBackground: string;
  layers: StudioLayer[];
  selectedId?: string;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onMoveLayer: (id: string, direction: -1 | 1) => void;
  layoutPages: 1 | 2;
  onLayoutPages: (pages: 1 | 2) => void;
  onApplyLayout: (layout: import("./fabric-canvas").LayoutId) => void;
};

function PanelTitle({ title, note }: { title: string; note?: string }) {  return (
    <div className="border-b border-line-soft px-4 py-4">
      <p className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-muted">
        {title}
      </p>
      {note && <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}

function BackgroundUpload({ canvasRef }: { canvasRef: RefObject<StudioCanvasHandle | null> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await uploadStudioImage(file);
      canvasRef.current?.setBackgroundImage(saved.url);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not upload that background.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="border-t border-line-soft p-4">
      <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">Background image</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void upload(event.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex h-8 w-full items-center justify-center gap-2 border border-line text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-body hover:border-yellow hover:text-yellow disabled:opacity-50"
      >
        <Plus size={11} />
        {busy ? "Uploading…" : "Upload background"}
      </button>
      {error && <p className="mt-2 text-[0.66rem] leading-relaxed text-coral">{error}</p>}
    </div>
  );
}

function PhotosPanel({ canvasRef }: { canvasRef: RefObject<StudioCanvasHandle | null> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<StudioUserImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listStudioImages()
      .then((items) => {
        if (active) setImages(items);
      })
      .catch(() => {
        // The built-in library remains available if uploads are unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const saved = await uploadStudioImage(file);
        setImages((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
        await canvasRef.current?.addImage(saved.url, r2Thumb(saved.url, 1600));
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not upload that image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <PanelTitle
        title="Photos"
        note="Choose a photograph or upload your own to place it on this page."
      />
      <div className="space-y-3 border-b border-line-soft p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void upload(event.target.files)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex h-9 w-full items-center justify-center gap-2 border border-yellow/60 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-yellow hover:bg-yellow/10 disabled:opacity-50"
        >
          <Plus size={12} />
          {busy ? "Uploading…" : "Upload photos"}
        </button>
        {error && <p className="text-[0.66rem] leading-relaxed text-coral">{error}</p>}
      </div>
      {images.length > 0 && (
        <div className="border-b border-line-soft p-3">
          <p className="mb-2 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-muted">
            Your photos
          </p>
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  void canvasRef.current?.addImage(
                    image.url,
                    r2Thumb(image.url, 1600),
                  )
                }
                className="group relative aspect-square overflow-hidden border border-line-soft bg-board-deep"
              >
                {/* Uploaded URLs are remote and already optimized by the media worker. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbUrl || image.url}
                  alt={image.originalName || "Uploaded photo"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 p-3">
        {PHOTOS.map((photo) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => void canvasRef.current?.addImage(photo.src)}
            className="group relative aspect-square overflow-hidden border border-line-soft bg-board-deep"
          >
            <Image
              src={photo.src}
              alt={photo.label}
              fill
              sizes="120px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-board-deep/80 px-2 py-1 text-left text-[0.58rem] uppercase tracking-[0.12em] text-chalk opacity-0 transition-opacity group-hover:opacity-100">
              {photo.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 border px-3 py-2.5 text-left text-[0.78rem] transition-colors",
        active
          ? "border-yellow bg-yellow/10 text-yellow"
          : "border-line-soft text-body hover:border-line hover:text-chalk",
      )}
    >
      {children}
    </button>
  );
}

function LayoutPreview({ layout }: { layout: LayoutDefinition }) {
  return (
    <div className="flex gap-1">
      {layout.preview.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="relative aspect-[210/297] min-w-0 flex-1 overflow-hidden border border-line bg-paper"
        >
          {page.map((block, blockIndex) => (
            <span
              key={blockIndex}
              className={cn(
                "absolute border",
                block.kind === "title"
                  ? "border-0 bg-[#2b2f36]/70"
                  : block.kind === "text"
                    ? "border-0 bg-[#2b2f36]/30"
                    : block.kind === "image"
                      ? "border-[#8b7d68] bg-[#d8d0be]"
                      : "border-[#8b7d68] bg-[#d8d0be]/45",
              )}
              style={{
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: `${block.w}%`,
                height: `${block.h}%`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function LayerRow({
  layer,
  depth,
  selectedId,
  onSelect,
  onVisibility,
  onLock,
  onMove,
}: {
  layer: StudioLayer;
  depth: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  onVisibility: (id: string) => void;
  onLock: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = layer.children.length > 0;
  const selected = layer.id === selectedId;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 border-b border-line-soft/50 py-1 pr-1 text-[0.7rem]",
          selected ? "bg-yellow/10 text-yellow" : "text-body hover:bg-white/[0.03]",
          !layer.visible && "opacity-45",
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Collapse group" : "Expand group"}
            className="grid h-4 w-4 shrink-0 place-items-center text-muted hover:text-chalk"
          >
            {open ? <CaretDown size={10} /> : <CaretRight size={10} />}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(layer.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <span
            className={cn(
              "grid h-4 w-4 shrink-0 place-items-center border font-mono text-[0.45rem]",
              layer.type === "group"
                ? "border-yellow/40 text-yellow"
                : "border-line-soft text-muted",
            )}
          >
            {layer.type === "group" ? "G" : layer.type.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 truncate">{layer.name}</span>
        </button>

        <div className="flex shrink-0 items-center opacity-70 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onMove(layer.id, 1)}
            aria-label="Move layer up"
            className="grid h-5 w-4 place-items-center text-muted hover:text-yellow"
          >
            <ArrowUp size={9} />
          </button>
          <button
            type="button"
            onClick={() => onMove(layer.id, -1)}
            aria-label="Move layer down"
            className="grid h-5 w-4 place-items-center text-muted hover:text-yellow"
          >
            <ArrowDown size={9} />
          </button>
          <button
            type="button"
            onClick={() => onVisibility(layer.id)}
            aria-label={layer.visible ? "Hide layer" : "Show layer"}
            className="grid h-5 w-5 place-items-center text-muted hover:text-chalk"
          >
            {layer.visible ? <Eye size={11} /> : <EyeSlash size={11} />}
          </button>
          <button
            type="button"
            onClick={() => onLock(layer.id)}
            aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
            className="grid h-5 w-5 place-items-center text-muted hover:text-chalk"
          >
            {layer.locked ? <Lock size={10} /> : <LockOpen size={10} />}
          </button>
        </div>
      </div>

      {hasChildren && open && (
        <div>
          {layer.children.map((child) => (
            <LayerRow
              key={child.id}
              layer={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onVisibility={onVisibility}
              onLock={onLock}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function StudioPanels({
  tool,
  canvasRef,
  pageBackground,
  layers,
  selectedId,
  onSelectLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onMoveLayer,
  layoutPages,
  onLayoutPages,
  onApplyLayout,
}: PanelProps) {
  if (tool === "layers") {
    return (
      <div>
        <PanelTitle
          title="Layers"
          note="Topmost layers render in front. Groups can be expanded recursively."
        />
        {layers.length ? (
          <div className="py-1">
            {layers.map((layer) => (
              <LayerRow
                key={layer.id}
                layer={layer}
                depth={0}
                selectedId={selectedId}
                onSelect={onSelectLayer}
                onVisibility={onToggleLayerVisibility}
                onLock={onToggleLayerLock}
                onMove={onMoveLayer}
              />
            ))}
          </div>
        ) : (
          <p className="p-4 text-[0.72rem] leading-relaxed text-muted">
            No layers on this page yet.
          </p>
        )}
      </div>
    );
  }

  if (tool === "layouts") {
    const available = layoutsForPages(layoutPages);
    return (
      <div>
        <PanelTitle
          title="Layouts"
          note="Choose a 1-page or 2-page layout. Applying it replaces everything on the affected page or pages."
        />
        <div className="border-b border-line-soft p-4">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">
            Layout type
          </p>
          <div className="flex border border-line">
            {([1, 2] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onLayoutPages(value)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] transition-colors",
                  layoutPages === value
                    ? "bg-yellow text-yellow-ink"
                    : "text-muted hover:text-chalk",
                )}
              >
                {value} page{value === 2 ? "s" : ""}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[0.66rem] leading-relaxed text-muted">
            {layoutPages === 1
              ? "Only 1-page layouts are shown. Click the gray page to choose which page to replace."
              : "Only 2-page layouts are shown. Applying one replaces both pages in the spread."}
          </p>
        </div>
        <div className="space-y-2 p-4">
          {available.map((layout) => (
            <button
              key={layout.id}
              type="button"
              onClick={() => onApplyLayout(layout.id)}
              className="group w-full border border-line-soft p-2 text-left transition-colors hover:border-yellow hover:bg-white/[0.03]"
            >
              <LayoutPreview layout={layout} />
              <span className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[0.72rem] font-semibold text-body group-hover:text-yellow">
                  {layout.label}
                </span>
                <span className="font-mono text-[0.5rem] uppercase tracking-[0.08em] text-muted">
                  {layout.pages}P
                </span>
              </span>
              <span className="mt-0.5 block text-[0.62rem] leading-relaxed text-muted">
                {layout.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tool === "photos") {
    return <PhotosPanel canvasRef={canvasRef} />;
  }

  if (tool === "text") {
    const presets = [
      { label: "Title", fontSize: 46, fontFamily: "Cormorant SC", fontWeight: "500" },
      { label: "Heading", fontSize: 34, fontFamily: "Alegreya Sans", fontWeight: "700" },
      { label: "Body", fontSize: 22, fontFamily: "Alegreya Sans", fontWeight: "normal" },
      { label: "Caption", fontSize: 16, fontFamily: "Alegreya Sans", fontWeight: "normal" },
    ];
    return (
      <div>
        <PanelTitle title="Text" note="Add a line, then edit it on the canvas or in the inspector." />
        <div className="space-y-2 p-4">
          {presets.map((preset) => (
            <ToolButton
              key={preset.label}
              onClick={() => canvasRef.current?.addText({ ...preset, label: preset.label })}
            >
              <span style={{ fontFamily: preset.fontFamily, fontSize: Math.min(preset.fontSize / 2, 18) }}>
                {preset.label}
              </span>
              <Plus size={13} aria-hidden="true" />
            </ToolButton>
          ))}
        </div>
      </div>
    );
  }

  if (tool === "shapes") {
    return (
      <div>
        <PanelTitle
          title="Shapes"
          note="Add a simple shape, then recolour or resize it on the page."
        />
        <div className="space-y-2 p-4">
          <ToolButton onClick={() => canvasRef.current?.addShape("rectangle")}>
            Rectangle <Plus size={13} aria-hidden="true" />
          </ToolButton>
          <ToolButton onClick={() => canvasRef.current?.addShape("ellipse")}>
            Circle <Plus size={13} aria-hidden="true" />
          </ToolButton>
          <ToolButton onClick={() => canvasRef.current?.addShape("triangle")}>
            Triangle <Plus size={13} aria-hidden="true" />
          </ToolButton>
          <ToolButton onClick={() => canvasRef.current?.addShape("line")}>
            Line <Plus size={13} aria-hidden="true" />
          </ToolButton>
        </div>
      </div>
    );
  }

  if (tool === "frames") {
    return (
      <div>
        <PanelTitle title="Frames" note="Choose the shape of the photograph frame." />
        <div className="space-y-2 p-4">
          <ToolButton onClick={() => canvasRef.current?.addFrame("portrait")}>
            Portrait frame <Plus size={13} aria-hidden="true" />
          </ToolButton>
          <ToolButton onClick={() => canvasRef.current?.addFrame("square")}>
            Square frame <Plus size={13} aria-hidden="true" />
          </ToolButton>
          <ToolButton onClick={() => canvasRef.current?.addFrame("landscape")}>
            Landscape frame <Plus size={13} aria-hidden="true" />
          </ToolButton>
          <ToolButton onClick={() => canvasRef.current?.addFrame("full")}>
            Full-page frame <Plus size={13} aria-hidden="true" />
          </ToolButton>
        </div>
      </div>
    );
  }

  if (tool === "filter") {
    return (
      <div>
        <PanelTitle title="Filter" note="Select a photo and choose a treatment." />
        <div className="space-y-2 p-4">
          {FILTERS.map((filter) => (
            <ToolButton
              key={filter.id}
              onClick={() => canvasRef.current?.applyFilter(filter.id)}
              active={false}
            >
              {filter.label}
            </ToolButton>
          ))}
        </div>
      </div>
    );
  }

  if (tool === "background") {
    return (
      <div>
        <PanelTitle title="Background" note="The colour under every object on this page." />
        <div className="grid grid-cols-4 gap-2 p-4">
          {BACKGROUNDS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => canvasRef.current?.setBackground(color)}
              aria-label={`Use background ${color}`}
              className={cn(
                "relative h-10 w-full border",
                pageBackground.toLowerCase() === color.toLowerCase()
                  ? "border-yellow"
                  : "border-line-soft",
              )}
              style={{ backgroundColor: color }}
            >
              {pageBackground.toLowerCase() === color.toLowerCase() && (
                <Check
                  size={13}
                  weight="bold"
                  className={color === "#2b2f36" ? "mx-auto text-chalk" : "mx-auto text-[#2b2f36]"}
                />
              )}
            </button>
          ))}
        </div>
        <div className="border-t border-line-soft p-4">
          <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">Gradients</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                type="button"
                aria-label="Apply gradient background"
                onClick={() => canvasRef.current?.setBackgroundGradient(gradient)}
                className={`h-12 border ${
                  pageBackground === gradient ? "border-yellow" : "border-line"
                }`}
                style={{ background: gradient }}
              />
            ))}
          </div>
        </div>
        <BackgroundUpload canvasRef={canvasRef} />
        <div className="border-t border-line-soft p-4">
          <label className="text-[0.68rem] uppercase tracking-[0.12em] text-muted" htmlFor="bg-color">
            Custom colour
          </label>
          <input
            id="bg-color"
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(pageBackground) ? pageBackground : "#f3f2ea"}
            onChange={(event) => canvasRef.current?.setBackground(event.target.value)}
            className="mt-2 h-10 w-full cursor-pointer border border-line bg-transparent p-1"
          />
        </div>
      </div>
    );
  }

  return null;
}
