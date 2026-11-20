"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  AlignBottom,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  AlignTop,
  ArrowsHorizontal,
  ArrowsVertical,
  Copy,
  LockSimple,
  LockSimpleOpen,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  Trash,
} from "@phosphor-icons/react";
import type { Canvas as FabricCanvasInstance, FabricObject } from "fabric";
import type { PageDocument } from "./api";
import { PAGE_SCHEMA_VERSION } from "./schema";
import { stripPageDocument } from "./sparse-json";
import type { StudioSelection } from "./store";

type StudioObject = FabricObject & { id?: string };

function isGradientBackground(value: string) {
  return (
    value.trim().startsWith("linear-gradient(") ||
    value.trim().startsWith("radial-gradient(") ||
    value.trim().startsWith("url(")
  );
}

function applyCanvasBackground(canvas: FabricCanvasInstance, background: string) {
  const gradient = isGradientBackground(background);
  canvas.backgroundColor = gradient ? "transparent" : background;
  canvas.lowerCanvasEl.style.background = gradient ? background : "";
  canvas.wrapperEl.style.background = gradient ? background : "";
  canvas.requestRenderAll();
}

function isLockedObject(object: FabricObject): boolean {
  return (
    (object as StudioObject & { studioLocked?: boolean }).studioLocked === true ||
    object.selectable === false ||
    object.lockMovementX === true ||
    object.lockScalingX === true
  );
}

const PALETTE = [
  "#2b2f36",
  "#ffffff",
  "#c66a5a",
  "#d8b56a",
  "#8f9d86",
  "#6f8396",
  "#f3f2ea",
  "#8b7d68",
  "#b8a7a0",
  "#506070",
];

let studioClipboard: FabricObject[] = [];

function regenerateObjectIds(object: FabricObject): void {
  (object as StudioObject).id = crypto.randomUUID();
  for (const child of childrenOf(object)) regenerateObjectIds(child);
}

export type TextPreset = {
  label: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
};

export type ImageFilterPreset =
  | "none"
  | "warm"
  | "cool"
  | "mono"
  | "fade"
  | "vivid";

export type FrameAspect = "portrait" | "square" | "landscape" | "full";
export type LayoutId =
  | "full"
  | "two"
  | "three"
  | "text"
  | "cover"
  | "split"
  | "mosaic"
  | "quote"
  | "spread-full"
  | "spread-story"
  | "spread-gallery"
  | "spread-cover";

export type StudioLayer = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  children: StudioLayer[];
};

export type StudioCanvasHandle = {
  addText: (preset?: TextPreset) => void;
  addImage: (url: string, previewUrl?: string) => Promise<void>;
  addSpreadHalf: (params: { url: string; side: "left" | "right"; groupId: string }) => Promise<void>;
  syncSpreadHalf: (params: {
    groupId: string;
    spreadX: number;
    spreadY: number;
    commit: boolean;
  }) => void;
  removeSpreadGroup: (groupId: string) => void;
  addFrame: (aspect?: FrameAspect) => void;
  addShape: (kind: "rectangle" | "ellipse" | "triangle" | "line") => void;
  alignSelection: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distributeSelection: (axis: "horizontal" | "vertical") => void;
  applyLayout: (layout: LayoutId, pages?: ("left" | "right")[]) => void;
  duplicateSelected: () => Promise<void>;
  deleteSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  updateSelected: (patch: Record<string, unknown>) => void;
  applyFilter: (preset: ImageFilterPreset) => void;
  setBackground: (color: string) => void;
  setBackgroundGradient: (gradient: string) => void;
  setBackgroundImage: (url: string) => void;
  toggleLock: (id: string) => void;
  editSelectedFrame: () => void;
  selectLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  moveLayer: (id: string, direction: -1 | 1) => void;
  getLayers: () => StudioLayer[];
};

type GuideGap = {
  left: number;
  top: number;
  width: number;
  height: number;
  label?: string;
};

type SmartGuides = {
  vertical: number[];
  horizontal: number[];
  gaps: GuideGap[];
};


type FabricCanvasProps = {
  page: PageDocument;
  width: number;
  height: number;
  zoom: number;
  pageWidth?: number;
  spreadMode?: boolean;
  bare?: boolean;
  onChange: (document: PageDocument) => void;
  onSelectionChange: (selection: StudioSelection) => void;
  onActivate?: () => void;
  onSpreadDelete?: (groupId: string) => void;
  onSpreadMove?: (groupId: string, spreadX: number, spreadY: number) => void;
  onSpreadCommit?: (groupId: string, spreadX: number, spreadY: number) => void;
  onLayersChange?: (layers: StudioLayer[]) => void;
  onFrameDelete?: (frameId: string) => void;
  showFloatingToolbar?: boolean;
  onToggleFloatingToolbar?: () => void;
  active?: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

function infoFor(object: FabricObject | null | undefined): StudioSelection {
  if (!object) return null;
  const value = object as FabricObject & {
    id?: string;
    text?: string;
    fill?: unknown;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    underline?: boolean;
    textAlign?: string;
    charSpacing?: number;
    lineHeight?: number;
    selectable?: boolean;
    lockMovementX?: boolean;
    lockScalingX?: boolean;
    studioFilter?: string;
  };
  const isImage = value.type === "image";

  return {
    id: String(value.id ?? ""),
    type: String(value.type ?? "object").toLowerCase(),
    fill: typeof value.fill === "string" ? value.fill : "#000000",
    fontSize: value.fontSize ?? 24,
    fontFamily: value.fontFamily ?? "Alegreya Sans",
    fontWeight: String(value.fontWeight ?? "normal"),
    fontStyle: String(value.fontStyle ?? "normal"),
    underline: Boolean(value.underline),
    textAlign: String(value.textAlign ?? "left"),
    charSpacing: value.charSpacing ?? 0,
    lineHeight: value.lineHeight ?? 1.2,
    locked:
      (value as StudioObject & { studioLocked?: boolean }).studioLocked === true ||
      value.selectable === false ||
      value.lockMovementX === true ||
      value.lockScalingX === true,
    isImage,
    isText: value.type === "textbox" || value.type === "i-text",
    filter: value.studioFilter,
  };
}

type ChildContainer = FabricObject & {
  getObjects?: () => FabricObject[];
  _objects?: FabricObject[];
  dirty?: boolean;
};

function childrenOf(object: FabricObject): FabricObject[] {
  const value = object as ChildContainer;
  if (value.type !== "group") return [];
  if (typeof value.getObjects === "function") return value.getObjects();
  return value._objects ?? [];
}

function ensureObjectIds(object: FabricObject): void {
  const tagged = object as StudioObject;
  if (!tagged.id) tagged.id = crypto.randomUUID();
  for (const child of childrenOf(object)) ensureObjectIds(child);
}

function layerLabel(object: FabricObject): string {
  const value = object as StudioObject & {
    text?: string;
    studioFrame?: boolean;
    studioFrameId?: string;
  };
  if (object.type === "group") return "Group";
  if (value.studioFrame) return "Photo frame";
  if (value.text) {
    const text = value.text.trim().replace(/\s+/g, " ");
    return text.length > 28 ? `${text.slice(0, 28)}…` : text || "Text";
  }
  switch (object.type) {
    case "image":
      return "Image";
    case "textbox":
    case "i-text":
    case "text":
      return "Text";
    case "rect":
      return "Rectangle";
    case "circle":
      return "Circle";
    case "ellipse":
      return "Ellipse";
    case "line":
      return "Line";
    case "triangle":
      return "Triangle";
    case "path":
      return "Path";
    default:
      return "Object";
  }
}

function buildLayers(objects: FabricObject[]): StudioLayer[] {
  return objects
    .filter(
      (object) =>
        !(object as StudioObject & { excludeFromExport?: boolean }).excludeFromExport,
    )
    .reverse()
    .map((object) => {
    ensureObjectIds(object);
    const tagged = object as StudioObject;
    return {
      id: String(tagged.id),
      name: layerLabel(object),
      type: object.type,
      visible: object.visible !== false,
      locked:
        (object as StudioObject & { studioLocked?: boolean }).studioLocked === true ||
        object.selectable === false ||
        object.lockMovementX === true ||
        object.lockScalingX === true,
      children: buildLayers(childrenOf(object)),
    };
  });
}

function serializeStudioObject(
  object: FabricObject,
  clipOverride?: FabricObject,
): Record<string, unknown> {
  const json = object.toObject() as Record<string, unknown>;
  const tagged = object as StudioObject & {
    studioFrame?: boolean;
    studioFrameId?: string;
    studioFrameOffsetX?: number;
    studioFrameOffsetY?: number;
    spreadGroupId?: string;
    spreadSide?: string;
    spreadX?: number;
    spreadY?: number;
    studioFilter?: string;
    studioLocked?: boolean;
    studioOriginalSrc?: string;
  };
  ensureObjectIds(object);
  json.id = tagged.id;
  if (tagged.studioFrame) json.studioFrame = true;
  if (tagged.studioFrameId) json.studioFrameId = tagged.studioFrameId;
  if (tagged.studioFilter) json.studioFilter = tagged.studioFilter;
  if (tagged.studioLocked) json.studioLocked = true;
  if (tagged.studioOriginalSrc) json.studioOriginalSrc = tagged.studioOriginalSrc;
  if (typeof tagged.studioFrameOffsetX === "number") {
    json.studioFrameOffsetX = tagged.studioFrameOffsetX;
  }
  if (typeof tagged.studioFrameOffsetY === "number") {
    json.studioFrameOffsetY = tagged.studioFrameOffsetY;
  }
  if (tagged.spreadGroupId) {
    json.spreadGroupId = tagged.spreadGroupId;
    json.spreadSide = tagged.spreadSide;
    json.spreadX = tagged.spreadX;
    json.spreadY = tagged.spreadY;
  }
  const children = childrenOf(object);
  if (children.length) {
    json.objects = children.map((child) => serializeStudioObject(child));
  }
  if (clipOverride) json.clipPath = clipOverride.toObject();
  return json;
}

function hydrateStudioObject(
  target: FabricObject,
  source: Record<string, unknown> | undefined,
  isTopLevel: boolean,
): void {
  if (!source) {
    ensureObjectIds(target);
    return;
  }
  const tagged = target as StudioObject & {
    studioFrame?: boolean;
    studioFrameId?: string;
    studioFrameOffsetX?: number;
    studioFrameOffsetY?: number;
    spreadGroupId?: string;
    spreadSide?: string;
    spreadX?: number;
    spreadY?: number;
    studioFilter?: string;
    studioLocked?: boolean;
    studioOriginalSrc?: string;
  };
  if (typeof source.id === "string") tagged.id = source.id;
  else ensureObjectIds(target);

  if (source.studioFrame === true) tagged.studioFrame = true;
  if (typeof source.studioFrameId === "string") tagged.studioFrameId = source.studioFrameId;
  if (typeof source.studioFilter === "string") tagged.studioFilter = source.studioFilter;
  if (typeof source.studioOriginalSrc === "string") tagged.studioOriginalSrc = source.studioOriginalSrc;
  if (source.studioLocked === true) {
    tagged.studioLocked = true;
    target.set({
      selectable: true,
      evented: true,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
    });
  }
  if (typeof source.studioFrameOffsetX === "number") {
    tagged.studioFrameOffsetX = source.studioFrameOffsetX;
  }
  if (typeof source.studioFrameOffsetY === "number") {
    tagged.studioFrameOffsetY = source.studioFrameOffsetY;
  }
  if (typeof source.spreadGroupId === "string") {
    tagged.spreadGroupId = source.spreadGroupId;
    tagged.spreadSide =
      typeof source.spreadSide === "string" ? source.spreadSide : undefined;
    if (typeof source.spreadX === "number") tagged.spreadX = source.spreadX;
    if (typeof source.spreadY === "number") tagged.spreadY = source.spreadY;
    if (isTopLevel && typeof source.spreadX === "number" && source.spreadY !== undefined) {
      target.set({
        left: source.spreadX,
        top: source.spreadY,
      });
    }
  }

  const children = childrenOf(target);
  const rawChildren = Array.isArray(source.objects)
    ? (source.objects as Record<string, unknown>[])
    : [];
  children.forEach((child, index) => {
    hydrateStudioObject(child, rawChildren[index], false);
  });

  if (source.selectable !== false && !tagged.spreadGroupId) {
    target.set({ selectable: true, evented: true });
  }
}

export const FabricCanvas = forwardRef<StudioCanvasHandle, FabricCanvasProps>(
  function FabricCanvas(
    { page, width, height, zoom, pageWidth = width, spreadMode = false, bare = false, onChange, onSelectionChange, onActivate, onSpreadDelete, onSpreadMove, onSpreadCommit, onLayersChange, onFrameDelete, showFloatingToolbar = true, onToggleFloatingToolbar, active = true, onUndo, onRedo },
    ref,
  ) {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = useRef<FabricCanvasInstance | null>(null);
    const snapLockRef = useRef<{ x?: number; y?: number }>({});
    const frameEditRef = useRef<{
      frame: FabricObject;
      images: FabricObject[];
      clips: Map<FabricObject, FabricObject | undefined>;
      masks: FabricObject[];
    } | null>(null);
    const frameEditCommitRef = useRef<(() => void) | null>(null);
    const enterFrameEditRef = useRef<((frame: FabricObject) => void) | null>(null);
    const updateFloatingRef = useRef<(() => void) | null>(null);
    const handleApiRef = useRef<StudioCanvasHandle | null>(null);
    const [floating, setFloating] = useState<{
      selection: NonNullable<StudioSelection>;
      rect: { left: number; top: number; width: number; height: number };
      isFrame: boolean;
      isGroup: boolean;
      isMulti: boolean;
    } | null>(null);
    const [colorOpen, setColorOpen] = useState(false);
    const dragContextRef = useRef<{
      target: FabricObject;
      otherRects: { left: number; top: number; width: number; height: number }[];
      xCandidates: number[];
      yCandidates: number[];
    } | null>(null);
    const loadingRef = useRef(true);
    const onChangeRef = useRef(onChange);
    const onSelectionRef = useRef(onSelectionChange);
    const onActivateRef = useRef(onActivate);
    const onSpreadDeleteRef = useRef(onSpreadDelete);
    const onSpreadMoveRef = useRef(onSpreadMove);
    const onSpreadCommitRef = useRef(onSpreadCommit);
    const onLayersChangeRef = useRef(onLayersChange);
    const onFrameDeleteRef = useRef(onFrameDelete);
    const suppressSpreadDeleteRef = useRef(false);
    const onUndoRef = useRef(onUndo);
    const onRedoRef = useRef(onRedo);
    const backgroundRef = useRef(page.background);
    const initialPageRef = useRef(page);
    const zoomRef = useRef(zoom);

    zoomRef.current = zoom;

    onChangeRef.current = onChange;
    onSelectionRef.current = onSelectionChange;
    onActivateRef.current = onActivate;
    onSpreadDeleteRef.current = onSpreadDelete;
    onSpreadMoveRef.current = onSpreadMove;
    onSpreadCommitRef.current = onSpreadCommit;
    onLayersChangeRef.current = onLayersChange;
    onFrameDeleteRef.current = onFrameDelete;
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
    backgroundRef.current = page.background;

    useEffect(() => {
      setColorOpen(false);
    }, [floating?.selection.id]);

    const exitFrameEdit = useCallback(() => {
      const canvas = canvasRef.current;
      const edit = frameEditRef.current;
      if (!canvas || !edit) return;
      loadingRef.current = true;
      for (const mask of edit.masks) canvas.remove(mask);
      loadingRef.current = false;
      for (const image of edit.images) {
        const clip = edit.clips.get(image);
        const tagged = image as StudioObject & {
          studioFrameOffsetX?: number;
          studioFrameOffsetY?: number;
        };
        tagged.studioFrameOffsetX = (image.left ?? 0) - (edit.frame.left ?? 0);
        tagged.studioFrameOffsetY = (image.top ?? 0) - (edit.frame.top ?? 0);
        image.set({
          clipPath: clip,
          selectable: false,
          evented: false,
          hasControls: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
        });
        image.setCoords();
      }
      edit.frame.set({ selectable: true, evented: true });
      edit.frame.setCoords();
      frameEditRef.current = null;
      canvas.setActiveObject(edit.frame);
      canvas.requestRenderAll();
      frameEditCommitRef.current?.();
    }, []);

    useEffect(() => {
      function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") exitFrameEdit();
      }
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [exitFrameEdit]);

    const deleteSelection = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.getActiveObjects().some(isLockedObject)) return;
      const editing = frameEditRef.current;
      if (editing) {
        const active = canvas.getActiveObject();
        if (active && editing.images.includes(active)) {
          editing.images = editing.images.filter((image) => image !== active);
          editing.clips.delete(active);
          canvas.remove(active);
          if (editing.images.length) {
            canvas.setActiveObject(editing.images[0]);
            canvas.requestRenderAll();
          } else {
            exitFrameEdit();
          }
          return;
        }
      }
      if (editing) exitFrameEdit();
      const targets = new Set(canvas.getActiveObjects());
      for (const object of [...targets]) {
        const frame = object as StudioObject & { studioFrame?: boolean };
        if (!frame.studioFrame) continue;
        const frameRect = frame.getBoundingRect();
        canvas
          .getObjects()
          .filter((item) => {
            const image = item as StudioObject & {
              type?: string;
              studioFrameId?: string;
            };
            if (image.studioFrameId) return image.studioFrameId === frame.id;
            if (image.type !== "image") return false;
            const centerX =
              (item.left ?? 0) + ((item.width ?? 0) * (item.scaleX ?? 1)) / 2;
            const centerY =
              (item.top ?? 0) + ((item.height ?? 0) * (item.scaleY ?? 1)) / 2;
            return (
              centerX >= frameRect.left &&
              centerX <= frameRect.left + frameRect.width &&
              centerY >= frameRect.top &&
              centerY <= frameRect.top + frameRect.height
            );
          })
          .forEach((image) => targets.add(image));
      }
      targets.forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      for (const object of targets) {
        const frame = object as StudioObject & { studioFrame?: boolean };
        if (frame.studioFrame && frame.id) onFrameDeleteRef.current?.(frame.id);
      }
      canvas.requestRenderAll();
    }, [exitFrameEdit]);

    const copySelection = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objects = canvas.getActiveObjects();
      if (!objects.length || objects.some(isLockedObject)) return;
      studioClipboard = await Promise.all(objects.map((object) => object.clone()));
    }, []);

    const pasteSelection = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas || !studioClipboard.length) return;
      const fabric = await import("fabric");
      const pasted: FabricObject[] = [];
      for (const source of studioClipboard) {
        const clone = await source.clone();
        regenerateObjectIds(clone);
        const tagged = clone as StudioObject & { studioFrameId?: string };
        delete tagged.studioFrameId;
        clone.set({
          left: (clone.left ?? 0) + 16,
          top: (clone.top ?? 0) + 16,
          selectable: true,
          evented: true,
        });
        clone.clipPath = undefined;
        canvas.add(clone);
        pasted.push(clone);
      }
      if (pasted.length === 1) {
        canvas.setActiveObject(pasted[0]);
      } else if (pasted.length > 1) {
        canvas.setActiveObject(
          new fabric.ActiveSelection(pasted, { canvas }),
        );
      }
      canvas.requestRenderAll();
    }, []);

    const cutSelection = useCallback(async () => {
      await copySelection();
      deleteSelection();
    }, [copySelection, deleteSelection]);

    const serialize = useCallback((canvas: FabricCanvasInstance): PageDocument => {
      const edit = frameEditRef.current;
      const elements = canvas
        .getObjects()
        .filter(
          (object) =>
            !(object as StudioObject & { excludeFromExport?: boolean }).excludeFromExport,
        )
        .map((object) => {
          const clip = edit?.images.includes(object) ? edit.clips.get(object) : undefined;
          return serializeStudioObject(object, clip);
        });

      return stripPageDocument({
        schemaVersion: PAGE_SCHEMA_VERSION,
        background: backgroundRef.current,
        elements,
      });
    }, []);

    const emitChange = useCallback(() => {
      if (loadingRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      onChangeRef.current(serialize(canvas));
      onSelectionRef.current(infoFor(canvas.getActiveObject()));
      onLayersChangeRef.current?.(buildLayers(canvas.getObjects()));
      updateFloatingRef.current?.();
    }, [serialize]);

    frameEditCommitRef.current = emitChange;

    const applyZoom = useCallback(
      (canvas: FabricCanvasInstance) => {
        canvas.setZoom(zoom);
        canvas.setDimensions({ width: width * zoom, height: height * zoom });
        canvas.requestRenderAll();
      },
      [height, width, zoom],
    );

    useEffect(() => {
      let disposed = false;
      let canvas: FabricCanvasInstance | null = null;
      let pendingTarget: FabricObject | null = null;
      let frameId: number | null = null;

      async function createCanvas() {
        if (!canvasElementRef.current) return;
        const fabric = await import("fabric");
        if (disposed || !canvasElementRef.current) return;

        canvas = new fabric.Canvas(canvasElementRef.current, {
          width: width * zoomRef.current,
          height: height * zoomRef.current,
          backgroundColor: isGradientBackground(initialPageRef.current.background)
            ? "transparent"
            : initialPageRef.current.background,
          preserveObjectStacking: true,
          selection: true,
        });
        canvasRef.current = canvas;
        canvas.setZoom(zoomRef.current);

        const syncFramePartner = (target?: FabricObject) => {
          if (!target || !canvas) return;
          if (frameEditRef.current?.images.includes(target)) return;
          const tagged = target as StudioObject & {
            studioFrame?: boolean;
            studioFrameId?: string;
            studioFrameOffsetX?: number;
            studioFrameOffsetY?: number;
          };
          let frame: FabricObject | undefined;
          if (tagged.studioFrameId) {
            frame = canvas
              .getObjects()
              .find((object) => (object as StudioObject).id === tagged.studioFrameId);
            if (frame && frame !== target) {
              frame.set({
                left: (target.left ?? 0) - (tagged.studioFrameOffsetX ?? 0),
                top: (target.top ?? 0) - (tagged.studioFrameOffsetY ?? 0),
              });
            }
          } else if (tagged.studioFrame) {
            frame = target;
            canvas
              .getObjects()
              .filter(
                (object) =>
                  (object as StudioObject & { studioFrameId?: string }).studioFrameId ===
                  tagged.id,
              )
              .forEach((image) => {
                const taggedImage = image as StudioObject & {
                  studioFrameOffsetX?: number;
                  studioFrameOffsetY?: number;
                };
                image.set({
                  left: (target.left ?? 0) + (taggedImage.studioFrameOffsetX ?? 0),
                  top: (target.top ?? 0) + (taggedImage.studioFrameOffsetY ?? 0),
                });
              });
          }
          if (frame) updateFrameImageClips(frame);
        };

        const updateFrameImageClips = (frame: FabricObject) => {
          if (!canvas) return;
          const id = (frame as StudioObject).id;
          const rect = frame.getBoundingRect();
          for (const object of canvas.getObjects()) {
            const image = object as StudioObject & {
              studioFrameId?: string;
              clipPath?: FabricObject & {
                set: (options: Record<string, number>) => void;
                dirty?: boolean;
              };
            };
            if (image.studioFrameId !== id || !image.clipPath) continue;
            image.clipPath.set({
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            });
            image.clipPath.dirty = true;
            image.dirty = true;
          }
        };

        const enterFrameEdit = (frame: FabricObject) => {
          if (!canvas) return;
          const frameId = (frame as StudioObject).id;
          const images = canvas
            .getObjects()
            .filter(
              (object) =>
                (object as StudioObject & { studioFrameId?: string }).studioFrameId ===
                frameId,
            );
          if (!images.length) return;

          const clips = new Map<FabricObject, FabricObject | undefined>();
          for (const image of images) {
            clips.set(
              image as FabricObject,
              (image as unknown as { clipPath?: FabricObject }).clipPath,
            );
            image.set({
              clipPath: undefined,
              selectable: true,
              evented: true,
              hasControls: true,
              lockMovementX: false,
              lockMovementY: false,
              lockScalingX: false,
              lockScalingY: false,
              lockRotation: true,
            });
            image.setCoords();
          }
          frame.set({ selectable: false, evented: false });
          canvas.setActiveObject(images[0]);
          canvas.requestRenderAll();
          onSelectionRef.current(infoFor(images[0]));
          updateFloating();
          const edit = { frame, images, clips, masks: [] as FabricObject[] };
          frameEditRef.current = edit;

          void import("fabric").then((fabric) => {
            if (!canvas || frameEditRef.current !== edit) return;
            const rect = frame.getBoundingRect();
            const right = rect.left + rect.width;
            const bottom = rect.top + rect.height;
            const masks = [
              { left: 0, top: 0, width, height: rect.top },
              { left: 0, top: bottom, width, height: height - bottom },
              { left: 0, top: rect.top, width: rect.left, height: rect.height },
              { left: right, top: rect.top, width: width - right, height: rect.height },
            ]
              .filter((box) => box.width > 0 && box.height > 0)
              .map((box) => {
                const mask = new fabric.Rect({
                  ...box,
                  originX: "left",
                  originY: "top",
                  fill: "rgba(43, 47, 54, 0.68)",
                  selectable: false,
                  evented: true,
                  hasControls: false,
                  hoverCursor: "pointer",
                });
                (mask as StudioObject & {
                  excludeFromExport?: boolean;
                  editingMask?: boolean;
                }).excludeFromExport = true;
                (mask as StudioObject & {
                  excludeFromExport?: boolean;
                  editingMask?: boolean;
                }).editingMask = true;
                return mask;
              });
            loadingRef.current = true;
            const editCanvas = canvas;
            if (!editCanvas) return;
            masks.forEach((mask) => editCanvas.add(mask));
            loadingRef.current = false;
            edit.masks = masks as FabricObject[];
            editCanvas.requestRenderAll();
          });
        };

        enterFrameEditRef.current = enterFrameEdit;

        const updateFloating = () => {
          if (!canvas) return;
          const active = canvas.getActiveObject();
          if (!active) {
            setFloating(null);
            return;
          }
          const rect = active.getBoundingRect();
          const info = infoFor(active);
          if (!info) {
            setFloating(null);
            return;
          }
          setFloating({
            selection: info,
            rect: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
            isFrame: Boolean(
              (active as StudioObject & { studioFrame?: boolean }).studioFrame,
            ),
            isGroup: active.type === "group" || active.type === "activeselection",
            isMulti: active.type === "activeselection",
          });
        };

        updateFloatingRef.current = updateFloating;

        const isPaired = (a: FabricObject, b: FabricObject) => {
          const left = a as StudioObject & { studioFrame?: boolean; studioFrameId?: string };
          const right = b as StudioObject & { studioFrame?: boolean; studioFrameId?: string };
          return (
            left.studioFrameId === right.id ||
            right.studioFrameId === left.id ||
            (left.studioFrame && right.studioFrameId === left.id) ||
            (right.studioFrame && left.studioFrameId === right.id)
          );
        };

        const buildDragContext = (target: FabricObject) => {
          if (!canvas) return;
          const objects = canvas.getObjects().filter(
            (object) =>
              object !== target &&
              object.visible !== false &&
              !(object as StudioObject & { excludeFromExport?: boolean }).excludeFromExport &&
              !isPaired(target, object),
          );
          const otherRects = objects.map((object) => object.getBoundingRect());
          const xCandidates = [0, width / 2, width];
          const yCandidates = [0, height / 2, height];
          for (const other of otherRects) {
            xCandidates.push(other.left, other.left + other.width / 2, other.left + other.width);
            yCandidates.push(other.top, other.top + other.height / 2, other.top + other.height);
          }
          dragContextRef.current = { target, otherRects, xCandidates, yCandidates };
        };

        const clearGuides = () => {
          const overlay = guideCanvasRef.current;
          const context = overlay?.getContext("2d");
          if (!overlay || !context) return;
          context.clearRect(0, 0, overlay.width, overlay.height);
        };

        const drawGuides = (next: SmartGuides) => {
          const overlay = guideCanvasRef.current;
          const context = overlay?.getContext("2d");
          if (!overlay || !context) return;

          const scale = overlay.width / width;
          context.clearRect(0, 0, overlay.width, overlay.height);

          context.lineWidth = 1;
          context.strokeStyle = "rgba(231, 198, 90, 0.9)";
          for (const position of next.vertical) {
            context.beginPath();
            context.moveTo(position * scale + 0.5, 0);
            context.lineTo(position * scale + 0.5, overlay.height);
            context.stroke();
          }
          for (const position of next.horizontal) {
            context.beginPath();
            context.moveTo(0, position * scale + 0.5);
            context.lineTo(overlay.width, position * scale + 0.5);
            context.stroke();
          }

          context.strokeStyle = "rgba(229, 154, 138, 0.95)";
          for (const gap of next.gaps) {
            context.beginPath();
            context.moveTo(gap.left * scale, gap.top * scale);
            context.lineTo(
              (gap.left + gap.width) * scale,
              (gap.top + gap.height) * scale,
            );
            context.stroke();
          }
        };

        const applySmartGuides = (target?: FabricObject, commit = false) => {
          if (!target || !canvas) return;
          const zoom = zoomRef.current;
          const threshold = 7 / zoom;
          const release = 13 / zoom;
          let context = dragContextRef.current;
          if (!context || context.target !== target) {
            buildDragContext(target);
            context = dragContextRef.current;
          }
          if (!context) return;
          const { otherRects, xCandidates, yCandidates } = context;

          const vertical: number[] = [];
          const horizontal: number[] = [];
          const gaps: GuideGap[] = [];

          let rect = { ...target.getBoundingRect() };

          const findAxisSnap = (
            anchors: number[],
            candidates: number[],
            locked: number | undefined,
          ) => {
            if (locked !== undefined) {
              const held = anchors.find((anchor) => Math.abs(anchor - locked) <= release);
              if (held !== undefined) {
                return { delta: locked - held, position: locked };
              }
            }

            let best: { delta: number; position: number } | null = null;
            for (const anchor of anchors) {
              for (const position of candidates) {
                const delta = position - anchor;
                if (Math.abs(delta) > threshold) continue;
                if (!best || Math.abs(delta) < Math.abs(best.delta)) {
                  best = { delta, position };
                }
              }
            }
            return best;
          };

          const bestX = findAxisSnap(
            [rect.left, rect.left + rect.width / 2, rect.left + rect.width],
            xCandidates,
            snapLockRef.current.x,
          );
          const bestY = findAxisSnap(
            [rect.top, rect.top + rect.height / 2, rect.top + rect.height],
            yCandidates,
            snapLockRef.current.y,
          );

          if (bestX) {
            target.set({ left: (target.left ?? 0) + bestX.delta });
            rect = { ...rect, left: rect.left + bestX.delta };
            vertical.push(bestX.position);
            snapLockRef.current.x = bestX.position;
          } else {
            snapLockRef.current.x = undefined;
          }

          if (bestY) {
            target.set({ top: (target.top ?? 0) + bestY.delta });
            rect = { ...rect, top: rect.top + bestY.delta };
            horizontal.push(bestY.position);
            snapLockRef.current.y = bestY.position;
          } else {
            snapLockRef.current.y = undefined;
          }

          const overlapsY = (r: { top: number; height: number }) =>
            Math.min(rect.top + rect.height, r.top + r.height) >
            Math.max(rect.top, r.top) + 2;
          const overlapsX = (r: { left: number; width: number }) =>
            Math.min(rect.left + rect.width, r.left + r.width) >
            Math.max(rect.left, r.left) + 2;

          // Only equalize spacing on an axis that did not snap to an alignment
          // guide; otherwise the two rules fight and the object feels sticky.
          if (!bestX) {
            const leftNeighbors = otherRects.filter(
              (r) => r.left + r.width <= rect.left + 1 && overlapsY(r),
            );
            const rightNeighbors = otherRects.filter(
              (r) => r.left >= rect.left + rect.width - 1 && overlapsY(r),
            );
            const left = leftNeighbors.sort((a, b) => b.left + b.width - (a.left + a.width))[0];
            const right = rightNeighbors.sort((a, b) => a.left - b.left)[0];

            if (left && right) {
              const leftGap = rect.left - (left.left + left.width);
              const rightGap = right.left - (rect.left + rect.width);
              if (leftGap > 1 && rightGap > 1 && Math.abs(leftGap - rightGap) <= threshold) {
                // Live spacing only nudges objects that are already within a
                // couple of pixels. Larger corrections happen on release so
                // the drag never fights the pointer.
                if (commit || Math.abs(leftGap - rightGap) <= 2) {
                  const delta = (leftGap - rightGap) / 2;
                  target.set({ left: (target.left ?? 0) + delta });
                  rect = { ...rect, left: rect.left + delta };
                }
                const gapY = rect.top + rect.height / 2;
                gaps.push({
                  left: left.left + left.width,
                  top: gapY,
                  width: Math.max(0, rect.left - (left.left + left.width)),
                  height: 1,
                });
                gaps.push({
                  left: rect.left + rect.width,
                  top: gapY,
                  width: Math.max(0, right.left - (rect.left + rect.width)),
                  height: 1,
                });
              }
            }
          }

          if (!bestY) {
            const topNeighbors = otherRects.filter(
              (r) => r.top + r.height <= rect.top + 1 && overlapsX(r),
            );
            const bottomNeighbors = otherRects.filter(
              (r) => r.top >= rect.top + rect.height - 1 && overlapsX(r),
            );
            const top = topNeighbors.sort((a, b) => b.top + b.height - (a.top + a.height))[0];
            const bottom = bottomNeighbors.sort((a, b) => a.top - b.top)[0];

            if (top && bottom) {
              const topGap = rect.top - (top.top + top.height);
              const bottomGap = bottom.top - (rect.top + rect.height);
              if (topGap > 1 && bottomGap > 1 && Math.abs(topGap - bottomGap) <= threshold) {
                if (commit || Math.abs(topGap - bottomGap) <= 2) {
                  const delta = (topGap - bottomGap) / 2;
                  target.set({ top: (target.top ?? 0) + delta });
                  rect = { ...rect, top: rect.top + delta };
                }
                const gapX = rect.left + rect.width / 2;
                gaps.push({
                  left: gapX,
                  top: top.top + top.height,
                  width: 1,
                  height: Math.max(0, rect.top - (top.top + top.height)),
                });
                gaps.push({
                  left: gapX,
                  top: rect.top + rect.height,
                  width: 1,
                  height: Math.max(0, bottom.top - (rect.top + rect.height)),
                });
              }
            }
          }

          target.setCoords();
          drawGuides({ vertical, horizontal, gaps });
        };

        canvas.on("object:modified", (event) => {
          setFloating(null);
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
          pendingTarget = null;
          if (frameEditRef.current?.images.includes(event.target)) {
            canvas?.requestRenderAll();
            updateFloating();
            return;
          }
          const spread = event.target as
            | (FabricObject & { spreadGroupId?: string; spreadSide?: string })
            | undefined;
          if (spread?.spreadGroupId) {
            onSpreadCommitRef.current?.(
              spread.spreadGroupId,
              (spread.left ?? 0) -
                (spreadMode && spread.spreadSide === "right" ? pageWidth : 0),
              spread.top ?? 0,
            );
            dragContextRef.current = null;
            snapLockRef.current = {};
            clearGuides();
            if (!onSpreadCommitRef.current) emitChange();
            updateFloating();
            return;
          }
          applySmartGuides(event.target, true);
          syncFramePartner(event.target);
          dragContextRef.current = null;
          snapLockRef.current = {};
          clearGuides();
          emitChange();
          updateFloating();
        });
        canvas.on("object:moving", (event) => {
          if (isLockedObject(event.target)) {
            canvas?.discardActiveObject();
            canvas?.requestRenderAll();
            return;
          }
          setFloating(null);
          const spread = event.target as
            | (FabricObject & { spreadGroupId?: string; spreadSide?: string })
            | undefined;
          if (spread?.spreadGroupId) {
            onSpreadMoveRef.current?.(
              spread.spreadGroupId,
              (spread.left ?? 0) -
                (spreadMode && spread.spreadSide === "right" ? pageWidth : 0),
              spread.top ?? 0,
            );
            canvas?.requestRenderAll();
            return;
          }
          pendingTarget = event.target;
          if (frameId !== null) return;
          frameId = requestAnimationFrame(() => {
            frameId = null;
            const target = pendingTarget;
            pendingTarget = null;
            if (!target || disposed) return;
            applySmartGuides(target, false);
            syncFramePartner(target);
            canvas?.requestRenderAll();
          });
        });
        canvas.on("mouse:down", (event) => {
          const target = event.target as
            | (FabricObject & { editingMask?: boolean })
            | undefined;
          if (target?.editingMask) {
            exitFrameEdit();
            return;
          }
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
          pendingTarget = null;
          snapLockRef.current = {};
          clearGuides();
          if (event.target) buildDragContext(event.target);
          else dragContextRef.current = null;
          onActivateRef.current?.();
        });
        canvas.on("mouse:up", () => {
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
          pendingTarget = null;
          clearGuides();
        });
        canvas.on("mouse:dblclick", (event) => {
          if (!canvas) return;
          const target = event.target as
            | (FabricObject & { studioFrame?: boolean; studioFrameId?: string })
            | undefined;
          if (!target) return;
          const frame = target.studioFrame
            ? target
            : canvas
                .getObjects()
                .find((object) => (object as StudioObject).id === target.studioFrameId);
          if (frame) enterFrameEdit(frame);
        });
        canvas.on("object:added", emitChange);
        canvas.on("object:removed", (event) => {
          const groupId = (event.target as StudioObject & { spreadGroupId?: string })
            .spreadGroupId;
          if (groupId && !suppressSpreadDeleteRef.current) {
            onSpreadDeleteRef.current?.(groupId);
          }
          emitChange();
        });

        canvas.on("selection:created", () => {
          onActivateRef.current?.();
          onSelectionRef.current(infoFor(canvas?.getActiveObject()));
          updateFloating();
        });
        canvas.on("selection:updated", () => {
          onActivateRef.current?.();
          onSelectionRef.current(infoFor(canvas?.getActiveObject()));
          updateFloating();
        });
        canvas.on("selection:cleared", () => {
          onSelectionRef.current(null);
          setFloating(null);
        });

        try {
          await canvas.loadFromJSON({
            objects: initialPageRef.current.elements,
            background: initialPageRef.current.background,
          });
        } catch {
          // Keep the canvas usable even when one stored object is malformed.
        }

        if (disposed) return;

        canvas.getObjects().forEach((object, index) => {
          const source = initialPageRef.current.elements[index] as
            | Record<string, unknown>
            | undefined;
          hydrateStudioObject(object, source, true);
          const tagged = object as StudioObject & {
            spreadGroupId?: string;
            spreadSide?: string;
            spreadX?: number;
            spreadY?: number;
          };
          if (tagged.spreadGroupId) {
            if (typeof tagged.spreadX === "number" && tagged.spreadY !== undefined) {
              object.set({
                left: spreadMode
                  ? tagged.spreadX +
                    (tagged.spreadSide === "right" ? pageWidth : 0)
                  : tagged.spreadX,
                top: tagged.spreadY,
              });
            }
            object.set({
              selectable: true,
              evented: true,
              hasControls: false,
              lockMovementX: false,
              lockMovementY: false,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
            });
          }
          if ((object as StudioObject & { studioFrameId?: string }).studioFrameId) {
            object.set({
              selectable: false,
              evented: false,
              hasControls: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
            });
          }
        });

        const loadedCanvas = canvas;
        loadedCanvas.getObjects().forEach((object) => {
          const frame = object as StudioObject & { studioFrame?: boolean };
          if (!frame.studioFrame) return;
          const hasPhoto = loadedCanvas
            .getObjects()
            .some(
              (image) =>
                (image as StudioObject & { studioFrameId?: string }).studioFrameId ===
                frame.id,
            );
          if (hasPhoto) loadedCanvas.bringObjectToFront(object);
        });

        applyCanvasBackground(canvas, initialPageRef.current.background);
        loadingRef.current = false;
        onLayersChangeRef.current?.(buildLayers(canvas.getObjects()));
      }

      void createCanvas();

      return () => {
        disposed = true;
        loadingRef.current = true;
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        pendingTarget = null;
        if (canvas) canvas.dispose();
        canvasRef.current = null;
      };
    }, [emitChange, exitFrameEdit, height, pageWidth, spreadMode, width]);

    useEffect(() => {
      if (canvasRef.current) applyZoom(canvasRef.current);
    }, [applyZoom]);

    function addObject(object: FabricObject, id = crypto.randomUUID()) {
      (object as StudioObject).id = id;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.add(object);
      canvas.setActiveObject(object);
      canvas.renderAll();
    }

    function forEachActive(callback: (object: FabricObject) => void) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObjects();
      const targets = active.length ? active : canvas.getActiveObject() ? [canvas.getActiveObject()!] : [];
      targets.forEach(callback);
      canvas.requestRenderAll();
    }

    function forEachActiveLocked() {
      const canvas = canvasRef.current;
      return Boolean(canvas?.getActiveObjects().some(isLockedObject));
    }

    useEffect(() => {
      function onKeyDown(event: KeyboardEvent) {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const target = event.target as HTMLElement | null;
        const inField =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;
        const editingText = Boolean(
          (canvas.getActiveObject() as { isEditing?: boolean } | null)?.isEditing,
        );
        const mod = event.ctrlKey || event.metaKey;

        if (mod && !inField && !editingText && event.key.toLowerCase() === "c") {
          event.preventDefault();
          void copySelection();
        }
        if (mod && !inField && !editingText && event.key.toLowerCase() === "v") {
          event.preventDefault();
          void pasteSelection();
        }
        if (mod && !inField && !editingText && event.key.toLowerCase() === "x") {
          event.preventDefault();
          void cutSelection();
        }

        if (event.key === "Delete" || event.key === "Backspace") {
          if (inField || editingText) return;
          const active = canvas.getActiveObjects();
          if (!active.length) return;
          event.preventDefault();
          deleteSelection();
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          if (event.shiftKey) onRedoRef.current();
          else onUndoRef.current();
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
          event.preventDefault();
          onRedoRef.current();
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && !inField) {
          event.preventDefault();
          const active = canvas.getActiveObject();
          if (!active) return;
          void active.clone().then((clone) => {
            (clone as StudioObject).id = crypto.randomUUID();
            clone.set({
              left: (clone.left ?? 0) + 24,
              top: (clone.top ?? 0) + 24,
            });
            canvas.add(clone);
            canvas.setActiveObject(clone);
            canvas.requestRenderAll();
          });
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && !inField) {
          event.preventDefault();
          const objects = canvas.getObjects().filter((object) => object.selectable);
          if (!objects.length) return;
          void import("fabric").then((fabric) => {
            canvas.discardActiveObject();
            canvas.setActiveObject(new fabric.ActiveSelection(objects, { canvas }));
            canvas.requestRenderAll();
          });
        }

        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) &&
          !inField &&
          !editingText
        ) {
          const active = canvas.getActiveObjects();
          if (!active.length || active.some(isLockedObject)) return;
          event.preventDefault();
          const step = event.shiftKey ? 10 : 1;
          active.forEach((object) => {
            if (event.key === "ArrowUp") object.set({ top: (object.top ?? 0) - step });
            if (event.key === "ArrowDown") object.set({ top: (object.top ?? 0) + step });
            if (event.key === "ArrowLeft") object.set({ left: (object.left ?? 0) - step });
            if (event.key === "ArrowRight") object.set({ left: (object.left ?? 0) + step });
            object.setCoords();
          });
          canvas.requestRenderAll();
          emitChange();
          updateFloatingRef.current?.();
        }

        if (event.key === "Escape") {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [active, copySelection, cutSelection, deleteSelection, emitChange, pasteSelection]);

    function findLayer(
      id: string,
      objects: FabricObject[],
      parent: FabricObject | null = null,
    ): { object: FabricObject; parent: FabricObject | null; index: number } | null {
      for (let index = 0; index < objects.length; index += 1) {
        const object = objects[index];
        if ((object as StudioObject).id === id) {
          return { object, parent, index };
        }
        const nested = childrenOf(object);
        if (nested.length) {
          const found = findLayer(id, nested, object);
          if (found) return found;
        }
      }
      return null;
    }

    function containsObject(object: FabricObject, target: FabricObject): boolean {
      if (object === target) return true;
      return childrenOf(object).some((child) => containsObject(child, target));
    }

    function rootGroup(
      canvas: FabricCanvasInstance,
      target: FabricObject,
    ): FabricObject {
      return (
        canvas.getObjects().find((object) => containsObject(object, target)) ?? target
      );
    }

    useImperativeHandle(ref, () => {
      const api: StudioCanvasHandle = {
      addText(preset) {
        void import("fabric").then((fabric) => {
          const text = new fabric.Textbox("Write a memory", {
            originX: "left",
            originY: "top",
            left: width * 0.12,
            top: height * 0.14,
            width: width * 0.76,
            fontFamily: preset?.fontFamily ?? "Alegreya Sans",
            fontSize: preset?.fontSize ?? 34,
            fontWeight: preset?.fontWeight ?? "normal",
            fill: "#2b2f36",
            lineHeight: 1.2,
            textAlign: "left",
          });
          addObject(text);
        });
      },
      addShape(kind) {
        void import("fabric").then((fabric) => {
          const targetWidth = spreadMode ? pageWidth : width;
          const size = Math.min(targetWidth, height) * 0.32;
          const left = targetWidth / 2 - size / 2;
          const top = height / 2 - size / 2;
          const common = {
            originX: "left" as const,
            originY: "top" as const,
            left,
            top,
            fill: "#d9d2c4",
            stroke: "#8b7d68",
            strokeWidth: 1,
          };
          const shape =
            kind === "ellipse"
              ? new fabric.Ellipse({ ...common, rx: size / 2, ry: size / 2 })
              : kind === "triangle"
                ? new fabric.Triangle({ ...common, width: size, height: size })
                : kind === "line"
                  ? new fabric.Line([0, 0, size * 1.5, 0], {
                      originX: "left",
                      originY: "top",
                      left: targetWidth / 2 - (size * 1.5) / 2,
                      top: height / 2,
                      stroke: "#8b7d68",
                      strokeWidth: 2,
                    })
                  : new fabric.Rect({ ...common, width: size, height: size });
          addObject(shape);
        });
      },
      alignSelection(alignment) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const objects = canvas.getActiveObjects();
        if (objects.length < 2 || objects.some(isLockedObject)) return;
        const rects = objects.map((object) => object.getBoundingRect());
        const left = Math.min(...rects.map((rect) => rect.left));
        const right = Math.max(...rects.map((rect) => rect.left + rect.width));
        const top = Math.min(...rects.map((rect) => rect.top));
        const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
        objects.forEach((object, index) => {
          const rect = rects[index];
          if (alignment === "left") object.set({ left: (object.left ?? 0) + left - rect.left });
          if (alignment === "center")
            object.set({ left: (object.left ?? 0) + (left + right) / 2 - (rect.left + rect.width / 2) });
          if (alignment === "right")
            object.set({ left: (object.left ?? 0) + right - (rect.left + rect.width) });
          if (alignment === "top") object.set({ top: (object.top ?? 0) + top - rect.top });
          if (alignment === "middle")
            object.set({ top: (object.top ?? 0) + (top + bottom) / 2 - (rect.top + rect.height / 2) });
          if (alignment === "bottom")
            object.set({ top: (object.top ?? 0) + bottom - (rect.top + rect.height) });
          object.setCoords();
        });
        canvas.requestRenderAll();
        emitChange();
      },
      distributeSelection(axis) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const objects = canvas.getActiveObjects();
        if (objects.length < 3 || objects.some(isLockedObject)) return;
        const entries = objects
          .map((object) => ({ object, rect: object.getBoundingRect() }))
          .sort((a, b) =>
            axis === "horizontal" ? a.rect.left - b.rect.left : a.rect.top - b.rect.top,
          );
        const first = entries[0].rect;
        const last = entries[entries.length - 1].rect;
        const total = entries.reduce(
          (sum, entry) => sum + (axis === "horizontal" ? entry.rect.width : entry.rect.height),
          0,
        );
        const gap =
          ((axis === "horizontal" ? last.left + last.width - first.left : last.top + last.height - first.top) -
            total) /
          (entries.length - 1);
        let cursor = axis === "horizontal" ? first.left : first.top;
        entries.forEach((entry) => {
          if (axis === "horizontal") {
            entry.object.set({ left: (entry.object.left ?? 0) + cursor - entry.rect.left });
            cursor += entry.rect.width + gap;
          } else {
            entry.object.set({ top: (entry.object.top ?? 0) + cursor - entry.rect.top });
            cursor += entry.rect.height + gap;
          }
          entry.object.setCoords();
        });
        canvas.requestRenderAll();
        emitChange();
      },
      async addImage(url, previewUrl) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const fabric = await import("fabric");
        const image = await fabric.FabricImage.fromURL(previewUrl || url, {
          crossOrigin: "anonymous",
        });
        if (previewUrl) {
          (image as StudioObject & { studioOriginalSrc?: string }).studioOriginalSrc = url;
        }

        const frames = canvas
          .getObjects()
          .filter((object) => Boolean((object as StudioObject & { studioFrame?: boolean }).studioFrame));
        const selected = canvas.getActiveObject() as
          | (StudioObject & { studioFrame?: boolean })
          | undefined;
        const usedFrameIds = new Set(
          canvas
            .getObjects()
            .map((object) => (object as StudioObject & { studioFrameId?: string }).studioFrameId)
            .filter(Boolean),
        );
        const frame =
          selected?.studioFrame && !usedFrameIds.has(selected.id ?? "")
            ? selected
            : frames.find((item) => !usedFrameIds.has((item as StudioObject).id ?? ""));

        if (frame) {
          const frameRect = frame.getBoundingRect();
          const sourceWidth = image.width || 1;
          const sourceHeight = image.height || 1;
          const scale = Math.max(
            frameRect.width / sourceWidth,
            frameRect.height / sourceHeight,
          );
          const clipPath = new fabric.Rect({
            originX: "left",
            originY: "top",
            left: frameRect.left,
            top: frameRect.top,
            width: frameRect.width,
            height: frameRect.height,
            absolutePositioned: true,
          });
          image.set({
            originX: "left",
            originY: "top",
            left:
              frameRect.left +
              (frameRect.width - sourceWidth * scale) / 2,
            top:
              frameRect.top +
              (frameRect.height - sourceHeight * scale) / 2,
            cropX: 0,
            cropY: 0,
            width: sourceWidth,
            height: sourceHeight,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
          });
          image.clipPath = clipPath;
          (image as StudioObject & { studioFrameId?: string }).studioFrameId =
            (frame as StudioObject).id;
          (image as StudioObject & {
            studioFrameOffsetX?: number;
            studioFrameOffsetY?: number;
          }).studioFrameOffsetX = (image.left ?? 0) - (frame.left ?? 0);
          (image as StudioObject & {
            studioFrameOffsetX?: number;
            studioFrameOffsetY?: number;
          }).studioFrameOffsetY = (image.top ?? 0) - (frame.top ?? 0);
          frame.set({ stroke: "rgba(139,125,104,0.6)", fill: "rgba(0,0,0,0.01)" });
          frame.setCoords();
          image.setCoords();
          addObject(image);
          canvas.bringObjectToFront(frame);
          canvas.setActiveObject(frame);
          canvas.requestRenderAll();
          return;
        } else {
          const maxWidth = width * 0.58;
          const maxHeight = height * 0.58;
          const scale = Math.min(
            maxWidth / (image.width || 1),
            maxHeight / (image.height || 1),
            1,
          );
          image.set({
            originX: "left",
            originY: "top",
            left: width * 0.21,
            top: height * 0.2,
            scaleX: scale,
            scaleY: scale,
          });
        }

        addObject(image);
      },
      async addSpreadHalf({ url, side, groupId }) {
        const fabric = await import("fabric");
        const image = await fabric.FabricImage.fromURL(url, {
          crossOrigin: "anonymous",
        });
        const spreadWidth = pageWidth * 2;
        const scale = Math.max(
          spreadWidth / (image.width || 1),
          height / (image.height || 1),
        );
        const spreadX = (spreadWidth - (image.width || 1) * scale) / 2;
        const spreadY = (height - (image.height || 1) * scale) / 2;
        const clipPath = new fabric.Rect({
          originX: "left",
          originY: "top",
          left: spreadMode && side === "right" ? pageWidth : 0,
          top: 0,
          width: pageWidth,
          height,
          absolutePositioned: true,
        });

        image.set({
          originX: "left",
          originY: "top",
          left: spreadMode
            ? spreadX + (side === "right" ? pageWidth : 0)
            : spreadX,
          top: spreadY,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true,
          hasControls: false,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: "move",
        });
        image.clipPath = clipPath;
        const tagged = image as StudioObject & {
          spreadGroupId?: string;
          spreadSide?: string;
          spreadX?: number;
          spreadY?: number;
        };
        tagged.spreadGroupId = groupId;
        tagged.spreadSide = side;
        tagged.spreadX = spreadX;
        tagged.spreadY = spreadY;
        addObject(image);
      },
      syncSpreadHalf({ groupId, spreadX, spreadY, commit }) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const targets = canvas
          .getObjects()
          .filter(
            (object) =>
              (object as StudioObject & { spreadGroupId?: string }).spreadGroupId ===
              groupId,
          ) as (FabricObject & { spreadSide?: string; spreadX?: number; spreadY?: number })[];
        if (!targets.length) return;
        for (const target of targets) {
          target.spreadX = spreadX;
          target.spreadY = spreadY;
          target.set({
            left:
              spreadMode
                ? spreadX + (target.spreadSide === "right" ? pageWidth : 0)
                : spreadX,
            top: spreadY,
          });
          target.setCoords();
        }
        canvas.requestRenderAll();
        if (commit) emitChange();
      },
      removeSpreadGroup(groupId) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const targets = canvas
          .getObjects()
          .filter(
            (object) =>
              (object as StudioObject & { spreadGroupId?: string }).spreadGroupId ===
              groupId,
          );
        if (!targets.length) return;
        suppressSpreadDeleteRef.current = true;
        targets.forEach((object) => canvas.remove(object));
        suppressSpreadDeleteRef.current = false;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      },
      addFrame(aspect = "portrait") {
        void import("fabric").then((fabric) => {
          const boxes: Record<FrameAspect, [number, number, number, number]> = {
            portrait: [0.22, 0.12, 0.56, 0.7],
            square: [0.2, 0.2, 0.6, 0.6],
            landscape: [0.1, 0.25, 0.8, 0.45],
            full: [0.06, 0.06, 0.88, 0.78],
          };
          const [x, y, w, h] = boxes[aspect];
          const frame = new fabric.Rect({
            originX: "left",
            originY: "top",
            left: width * x,
            top: height * y,
            width: width * w,
            height: height * h,
            fill: "rgba(216, 208, 190, 0.32)",
            stroke: "#8b7d68",
            strokeWidth: 1.5,
            strokeDashArray: [7, 5],
            rx: 2,
            ry: 2,
          });
          (frame as StudioObject & { studioFrame?: boolean }).studioFrame = true;
          addObject(frame);
        });
      },
      applyLayout(layout, pages) {
        void import("fabric").then((fabric) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const layoutWidth = spreadMode ? pageWidth : width;
          const selectedPages: ("left" | "right")[] =
            spreadMode && pages?.length
              ? pages
              : spreadMode
                ? ["left", "right"]
                : ["left"];

          loadingRef.current = true;
          canvas.getObjects().forEach((object) => {
            if (!spreadMode) {
              canvas.remove(object);
              return;
            }
            const center =
              (object.left ?? 0) +
              ((object.width ?? 0) * (object.scaleX ?? 1)) / 2;
            const side = center < pageWidth ? "left" : "right";
            if (selectedPages.includes(side)) canvas.remove(object);
          });

          const addFrameBox = (
            offset: number,
            x: number,
            y: number,
            w: number,
            h: number,
          ) => {
            const frame = new fabric.Rect({
              originX: "left",
              originY: "top",
              left: offset + layoutWidth * x,
              top: height * y,
              width: layoutWidth * w,
              height: height * h,
              fill: "rgba(216, 208, 190, 0.32)",
              stroke: "#8b7d68",
              strokeWidth: 1.5,
              strokeDashArray: [7, 5],
              rx: 2,
              ry: 2,
            });
            (frame as StudioObject & { studioFrame?: boolean }).studioFrame = true;
            (frame as StudioObject).id = crypto.randomUUID();
            canvas.add(frame);
          };
          const addCopy = (
            offset: number,
            value: string,
            left: number,
            top: number,
            boxWidth: number,
            fontSize: number,
            fontFamily = "Alegreya Sans",
            weight = "normal",
          ) => {
            const text = new fabric.Textbox(value, {
              originX: "left",
              originY: "top",
              left: offset + layoutWidth * left,
              top: height * top,
              width: layoutWidth * boxWidth,
              fontFamily,
              fontSize,
              fontWeight: weight,
              fill: "#2b2f36",
              lineHeight: 1.2,
            });
            (text as StudioObject).id = crypto.randomUUID();
            canvas.add(text);
          };

          for (const page of selectedPages) {
            const offset = spreadMode && page === "right" ? pageWidth : 0;
            if (layout === "spread-full") {
              addFrameBox(offset, 0.06, 0.07, 0.88, 0.76);
              addCopy(offset, "A spread of quiet moments", 0.06, 0.87, 0.5, 14);
            } else if (layout === "spread-story") {
              if (page === "left") {
                addFrameBox(offset, 0.06, 0.07, 0.88, 0.78);
                addCopy(offset, "The photograph", 0.06, 0.89, 0.5, 14);
              } else {
                addCopy(
                  offset,
                  "A story worth keeping",
                  0.1,
                  0.16,
                  0.72,
                  40,
                  "Cormorant SC",
                  "500",
                );
                addCopy(
                  offset,
                  "Write the part of the memory that the picture cannot hold.",
                  0.1,
                  0.4,
                  0.6,
                  18,
                );
              }
            } else if (layout === "spread-gallery") {
              addFrameBox(offset, 0.05, 0.08, 0.42, 0.64);
              addFrameBox(offset, 0.52, 0.08, 0.42, 0.64);
              addCopy(offset, "A pair of memories", 0.05, 0.82, 0.5, 14);
            } else if (layout === "spread-cover") {
              if (page === "left") {
                addCopy(
                  offset,
                  "WRITE A MEMORY",
                  0.1,
                  0.18,
                  0.8,
                  40,
                  "Cormorant SC",
                  "500",
                );
                addCopy(offset, "and keep it close", 0.1, 0.34, 0.5, 18);
              } else {
                addFrameBox(offset, 0.06, 0.07, 0.88, 0.8);
              }
            } else if (layout === "split") {
              addFrameBox(offset, 0.06, 0.08, 0.48, 0.72);
              addCopy(
                offset,
                "A title",
                0.6,
                0.12,
                0.32,
                32,
                "Cormorant SC",
                "500",
              );
              addCopy(
                offset,
                "A few lines beside the photograph.",
                0.6,
                0.3,
                0.28,
                16,
              );
            } else if (layout === "mosaic") {
              addFrameBox(offset, 0.06, 0.08, 0.42, 0.34);
              addFrameBox(offset, 0.52, 0.08, 0.42, 0.34);
              addFrameBox(offset, 0.06, 0.46, 0.42, 0.34);
              addFrameBox(offset, 0.52, 0.46, 0.42, 0.34);
              addCopy(offset, "A page of small moments", 0.06, 0.84, 0.55, 14);
            } else if (layout === "quote") {
              addCopy(
                offset,
                "Some memories stay with us",
                0.14,
                0.3,
                0.6,
                36,
                "Cormorant SC",
                "500",
              );
              addCopy(offset, "A quiet line beneath it", 0.22, 0.56, 0.46, 14);
            } else if (layout === "full") {
              addFrameBox(offset, 0.07, 0.07, 0.86, 0.7);
              addCopy(offset, "A line about this photograph", 0.07, 0.81, 0.86, 16);
            } else if (layout === "two") {
              addFrameBox(offset, 0.06, 0.08, 0.42, 0.68);
              addFrameBox(offset, 0.52, 0.08, 0.42, 0.68);
              addCopy(offset, "Two photographs, one memory", 0.06, 0.82, 0.88, 16);
            } else if (layout === "three") {
              addFrameBox(offset, 0.06, 0.08, 0.46, 0.68);
              addFrameBox(offset, 0.56, 0.08, 0.38, 0.32);
              addFrameBox(offset, 0.56, 0.44, 0.38, 0.32);
              addCopy(offset, "A page of small moments", 0.06, 0.82, 0.88, 15);
            } else if (layout === "text") {
              addCopy(
                offset,
                "A title for this page",
                0.1,
                0.16,
                0.8,
                40,
                "Cormorant SC",
                "500",
              );
              addCopy(
                offset,
                "A few lines of text. Tell the part of the story that the photographs cannot.",
                0.1,
                0.42,
                0.8,
                18,
              );
            } else {
              addCopy(
                offset,
                "WRITE A MEMORY",
                0.08,
                0.12,
                0.84,
                38,
                "Cormorant SC",
                "500",
              );
              addCopy(offset, "and keep it close", 0.08, 0.24, 0.84, 20);
            }
          }

          loadingRef.current = false;
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          emitChange();
        });
      },
      async duplicateSelected() {
        const canvas = canvasRef.current;
        const active = canvas?.getActiveObject();
        if (!canvas || !active || isLockedObject(active)) return;
        const clone = await active.clone();
        (clone as StudioObject).id = crypto.randomUUID();
        clone.set({ left: (clone.left ?? 0) + 24, top: (clone.top ?? 0) + 24 });
        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.requestRenderAll();
      },
      deleteSelected: deleteSelection,
      groupSelected() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (active.length < 2 || active.some(isLockedObject)) return;
        void import("fabric").then((fabric) => {
          const group = new fabric.Group(active);
          (group as StudioObject).id = crypto.randomUUID();
          active.forEach((object) => canvas.remove(object));
          canvas.add(group);
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
        });
      },
      ungroupSelected() {
        const canvas = canvasRef.current;
        const active = canvas?.getActiveObject();
        if (!canvas || !active || active.type !== "group" || isLockedObject(active)) return;
        void import("fabric").then(() => {
          const group = active as unknown as {
            removeAll: () => FabricObject[];
            getObjects?: () => FabricObject[];
          };
          const objects = group.getObjects?.() ?? [];
          canvas.remove(active);
          objects.forEach((object) => {
            (object as StudioObject).id = crypto.randomUUID();
            canvas.add(object);
          });
          canvas.requestRenderAll();
        });
      },
      updateSelected(patch) {
        if (forEachActiveLocked()) return;
        forEachActive((object) => object.set(patch));
        emitChange();
        onSelectionRef.current(infoFor(canvasRef.current?.getActiveObject()));
      },
      applyFilter(preset) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active || active.type !== "image" || isLockedObject(active)) return;

        void import("fabric").then((fabric) => {
          const values: Record<ImageFilterPreset, [number, number, number]> = {
            none: [0, 0, 0],
            warm: [0.05, 0.05, 0.15],
            cool: [0.02, 0.08, -0.1],
            mono: [0, 0, -1],
            fade: [0.08, -0.2, -0.2],
            vivid: [0.03, 0.15, 0.3],
          };
          const [brightness, contrast, saturation] = values[preset];
          const filters: unknown[] = [];
          if (brightness) filters.push(new fabric.filters.Brightness({ brightness }));
          if (contrast) filters.push(new fabric.filters.Contrast({ contrast }));
          if (saturation) filters.push(new fabric.filters.Saturation({ saturation }));
          (active as unknown as { filters: unknown[] }).filters = filters;
          (active as StudioObject & { studioFilter?: string }).studioFilter = preset;
          (active as unknown as { applyFilters: () => void }).applyFilters();
          canvas.requestRenderAll();
          emitChange();
        });
      },
      setBackground(color) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        backgroundRef.current = color;
        canvas.backgroundColor = color;
        canvas.lowerCanvasEl.style.background = "";
        canvas.wrapperEl.style.background = "";
        canvas.requestRenderAll();
        emitChange();
      },
      setBackgroundGradient(gradient) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        backgroundRef.current = gradient;
        canvas.backgroundColor = "transparent";
        canvas.lowerCanvasEl.style.background = gradient;
        canvas.wrapperEl.style.background = gradient;
        canvas.requestRenderAll();
        emitChange();
      },
      setBackgroundImage(url) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const background = `url("${url}") center / cover no-repeat`;
        backgroundRef.current = background;
        canvas.backgroundColor = "transparent";
        canvas.lowerCanvasEl.style.background = background;
        canvas.wrapperEl.style.background = background;
        canvas.requestRenderAll();
        emitChange();
      },
      toggleLock(id) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const record = findLayer(id, canvas.getObjects());
        if (!record) return;
        const locked =
          (record.object as StudioObject & { studioLocked?: boolean }).studioLocked ===
            true ||
          record.object.selectable === false ||
          record.object.lockMovementX === true ||
          record.object.lockScalingX === true;
        const nextLocked = !locked;
        (record.object as StudioObject & { studioLocked?: boolean }).studioLocked =
          nextLocked;
        record.object.set({
          selectable: true,
          evented: record.object.visible !== false,
          hasControls: !nextLocked,
          lockMovementX: nextLocked,
          lockMovementY: nextLocked,
          lockRotation: nextLocked,
          lockScalingX: nextLocked,
          lockScalingY: nextLocked,
        });
        if ((record.object as StudioObject & { studioFrame?: boolean }).studioFrame) {
          canvas
            .getObjects()
            .filter(
              (item) =>
                (item as StudioObject & { studioFrameId?: string }).studioFrameId ===
                (record.object as StudioObject).id,
            )
            .forEach((image) =>
              image.set({
                selectable: false,
                evented: false,
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
              }),
            );
        }
        canvas.requestRenderAll();
        emitChange();
      },
      selectLayer(id) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const record = findLayer(id, canvas.getObjects());
        if (!record) return;
        const root = rootGroup(canvas, record.object);
        if (root.selectable === false || root.visible === false) return;
        canvas.setActiveObject(root);
        canvas.requestRenderAll();
        onSelectionRef.current(infoFor(root));
      },
      toggleLayerVisibility(id) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const record = findLayer(id, canvas.getObjects());
        if (!record) return;
        const visible = record.object.visible !== false;
        record.object.set({
          visible: !visible,
          evented: visible ? false : record.object.selectable !== false,
        });
        (record.object as ChildContainer).dirty = true;
        if ((record.object as StudioObject & { studioFrame?: boolean }).studioFrame) {
          canvas
            .getObjects()
            .filter(
              (item) =>
                (item as StudioObject & { studioFrameId?: string }).studioFrameId ===
                (record.object as StudioObject).id,
            )
            .forEach((image) =>
              image.set({
                visible: !visible,
                evented: visible ? false : image.selectable !== false,
              }),
            );
        }
        if (!visible) {
          const active = canvas.getActiveObject();
          if (active && containsObject(active, record.object)) {
            canvas.discardActiveObject();
          }
        }
        canvas.requestRenderAll();
        emitChange();
      },
      toggleLayerLock(id) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const record = findLayer(id, canvas.getObjects());
        if (!record) return;
        const locked =
          (record.object as StudioObject & { studioLocked?: boolean }).studioLocked ===
            true ||
          record.object.selectable === false ||
          record.object.lockMovementX === true ||
          record.object.lockScalingX === true;
        const nextLocked = !locked;
        (record.object as StudioObject & { studioLocked?: boolean }).studioLocked =
          nextLocked;
        record.object.set({
          selectable: true,
          evented: record.object.visible !== false,
          hasControls: !nextLocked,
          lockMovementX: nextLocked,
          lockMovementY: nextLocked,
          lockRotation: nextLocked,
          lockScalingX: nextLocked,
          lockScalingY: nextLocked,
        });
        if ((record.object as StudioObject & { studioFrame?: boolean }).studioFrame) {
          canvas
            .getObjects()
            .filter(
              (item) =>
                (item as StudioObject & { studioFrameId?: string }).studioFrameId ===
                (record.object as StudioObject).id,
            )
            .forEach((image) =>
              image.set({
                selectable: false,
                evented: false,
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
              }),
            );
        }
        canvas.requestRenderAll();
        emitChange();
      },
      moveLayer(id, direction) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const record = findLayer(id, canvas.getObjects());
        if (!record) return;
        const target = record.index + direction;
        if (record.parent) {
          const container = childrenOf(record.parent);
          if (target < 0 || target >= container.length) return;
          const raw = (record.parent as ChildContainer)._objects ?? container;
          const [object] = raw.splice(record.index, 1);
          raw.splice(target, 0, object);
          (record.parent as ChildContainer).dirty = true;
          record.parent.setCoords();
          canvas.requestRenderAll();
          emitChange();
          return;
        }
        if (target < 0 || target >= canvas.getObjects().length) return;
        canvas.moveObjectTo(record.object, target);
        canvas.requestRenderAll();
        emitChange();
      },
      getLayers() {
        const canvas = canvasRef.current;
        return canvas ? buildLayers(canvas.getObjects()) : [];
      },
      editSelectedFrame() {
        const active = canvasRef.current?.getActiveObject() as
          | (FabricObject & { studioFrame?: boolean })
          | undefined;
        if (active?.studioFrame) {
          enterFrameEditRef.current?.(active);
        }
      },
      };
      handleApiRef.current = api;
      return api;
    });

    const canvasBox = (
      <div
        className="relative"
        style={{ width: width * zoom, height: height * zoom }}
      >
        <canvas ref={canvasElementRef} aria-label="Book page canvas" />
        <canvas
          ref={guideCanvasRef}
          aria-hidden="true"
          width={Math.round(width * zoom)}
          height={Math.round(height * zoom)}
          className="pointer-events-none absolute inset-0 z-30"
          style={{ width: width * zoom, height: height * zoom }}
        />
        {active && showFloatingToolbar && floating && (() => {
          const selection = floating.selection;
          const isText = selection.isText;
          const isImage = selection.isImage;
          const isFrame = floating.isFrame;
          const isGroup = floating.isGroup;
          const isMulti = floating.isMulti;
          const editingImage = Boolean(frameEditRef.current);
          const toolbarLeft = Math.min(
            Math.max((floating.rect.left + floating.rect.width / 2) * zoom, 8),
            Math.max(8, width * zoom - 8),
          );
          const isAbove = floating.rect.top * zoom > 58;
          const toolbarTop = isAbove
            ? floating.rect.top * zoom - 8
            : (floating.rect.top + floating.rect.height) * zoom + 8;
          const api = handleApiRef.current;
          return (
            <div
              className="absolute z-40 flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-0.5 border border-line bg-board-deep/95 p-1 text-chalk shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur"
              style={{
                left: toolbarLeft,
                top: toolbarTop,
                transform: isAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {selection.locked && (
                <span className="px-1 font-mono text-[0.52rem] uppercase tracking-[0.08em] text-yellow">
                  Locked
                </span>
              )}
              <fieldset
                disabled={selection.locked}
                className={
                  selection.locked
                    ? "m-0 flex items-center gap-0.5 border-0 p-0 opacity-40 pointer-events-none"
                    : "contents"
                }
              >
              {isText && (
                <>
                  <button
                    type="button"
                    title="Bold"
                    aria-label="Bold"
                    aria-pressed={selection.fontWeight === "bold"}
                    onClick={() =>
                      api?.updateSelected({
                        fontWeight:
                          selection.fontWeight === "bold" ? "normal" : "bold",
                      })
                    }
                    className={`grid h-6 w-6 place-items-center font-bold text-[0.75rem] hover:bg-white/10 ${
                      selection.fontWeight === "bold" ? "bg-yellow/20 text-yellow" : ""
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    title="Italic"
                    aria-label="Italic"
                    aria-pressed={selection.fontStyle === "italic"}
                    onClick={() =>
                      api?.updateSelected({
                        fontStyle:
                          selection.fontStyle === "italic" ? "normal" : "italic",
                      })
                    }
                    className={`grid h-6 w-6 place-items-center font-serif text-[0.8rem] italic hover:bg-white/10 ${
                      selection.fontStyle === "italic" ? "bg-yellow/20 text-yellow" : ""
                    }`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    title="Underline"
                    aria-label="Underline"
                    aria-pressed={selection.underline}
                    onClick={() => api?.updateSelected({ underline: !selection.underline })}
                    className={`grid h-6 w-6 place-items-center text-[0.75rem] underline hover:bg-white/10 ${
                      selection.underline ? "bg-yellow/20 text-yellow" : ""
                    }`}
                  >
                    U
                  </button>
                  <button
                    type="button"
                    title="Decrease font size"
                    aria-label="Decrease font size"
                    onClick={() =>
                      api?.updateSelected({
                        fontSize: Math.max(8, selection.fontSize - 1),
                      })
                    }
                    className="grid h-6 w-6 place-items-center text-[0.8rem] hover:bg-white/10"
                  >
                    −
                  </button>
                  <span className="grid h-6 min-w-6 place-items-center px-1 font-mono text-[0.55rem] text-muted">
                    {Math.round(selection.fontSize)}
                  </span>
                  <button
                    type="button"
                    title="Increase font size"
                    aria-label="Increase font size"
                    onClick={() =>
                      api?.updateSelected({
                        fontSize: Math.min(160, selection.fontSize + 1),
                      })
                    }
                    className="grid h-6 w-6 place-items-center text-[0.8rem] hover:bg-white/10"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    title="Change text colour"
                    aria-label="Change text colour"
                    aria-expanded={colorOpen}
                    onClick={() => setColorOpen((value) => !value)}
                    className="grid h-6 w-6 place-items-center hover:bg-white/10"
                  >
                    <span
                      className="block h-3 w-3 border border-white/50"
                      style={{ backgroundColor: selection.fill }}
                    />
                  </button>
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      title={`Align ${align}`}
                      aria-label={`Align ${align}`}
                      aria-pressed={selection.textAlign === align}
                      onClick={() => api?.updateSelected({ textAlign: align })}
                      className={`grid h-6 w-5 place-items-center text-[0.65rem] hover:bg-white/10 ${
                        selection.textAlign === align
                          ? "bg-yellow/20 text-yellow"
                          : ""
                      }`}
                    >
                      {align === "left" ? (
                        <TextAlignLeft size={11} />
                      ) : align === "center" ? (
                        <TextAlignCenter size={11} />
                      ) : (
                        <TextAlignRight size={11} />
                      )}
                    </button>
                  ))}
                </>
              )}
              {!isText && !isImage && !isFrame && !isGroup && (
                <button
                  type="button"
                  title="Change fill colour"
                  aria-label="Change fill colour"
                  aria-expanded={colorOpen}
                  onClick={() => setColorOpen((value) => !value)}
                  className="grid h-6 w-6 place-items-center hover:bg-white/10"
                >
                  <span
                    className="block h-3 w-3 border border-white/50"
                    style={{ backgroundColor: selection.fill }}
                  />
                </button>
              )}
              {colorOpen && (isText || (!isImage && !isFrame && !isGroup)) && (
                <div className="absolute left-0 top-full z-50 mt-1 grid w-[116px] grid-cols-5 gap-1 border border-line bg-board-deep/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Set colour ${color}`}
                      onClick={() => {
                        if (selection.type === "line") {
                          api?.updateSelected({ stroke: color });
                        } else {
                          api?.updateSelected({ fill: color });
                        }
                        setColorOpen(false);
                      }}
                      className={`h-4 w-4 border ${
                        selection.fill.toLowerCase() === color
                          ? "border-yellow"
                          : "border-white/30"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
              {isImage && !editingImage && (
                <select
                  aria-label="Image filter"
                  value={selection.filter ?? "none"}
                  onChange={(event) =>
                    api?.applyFilter(
                      event.target.value as ImageFilterPreset,
                    )
                  }
                  className="h-6 max-w-[84px] border-0 bg-transparent px-1 font-mono text-[0.55rem] uppercase tracking-[0.04em] text-chalk outline-none"
                >
                  <option value="none">Original</option>
                  <option value="warm">Warm</option>
                  <option value="cool">Cool</option>
                  <option value="mono">B&amp;W</option>
                  <option value="fade">Fade</option>
                  <option value="vivid">Vivid</option>
                </select>
              )}
              {isImage && editingImage && (
                <button
                  type="button"
                  onClick={exitFrameEdit}
                  className="h-6 border border-yellow/60 px-2 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-yellow hover:bg-yellow/10"
                >
                  Done
                </button>
              )}
              {isFrame && (
                <button
                  type="button"
                  title="Edit photo in frame"
                  onClick={() => api?.editSelectedFrame()}
                  className="h-6 border border-line px-2 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-body hover:border-yellow hover:text-yellow"
                >
                  Edit photo
                </button>
              )}
              {isGroup && (
                <button
                  type="button"
                  title={isMulti ? "Group" : "Ungroup"}
                  aria-label={isMulti ? "Group" : "Ungroup"}
                  onClick={() =>
                    isMulti ? api?.groupSelected() : api?.ungroupSelected()
                  }
                  className="h-6 border border-line px-2 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-body hover:border-yellow hover:text-yellow"
                >
                  {isMulti ? "Group" : "Ungroup"}
                </button>
              )}
              {isMulti && (
                <>
                  <span className="mx-0.5 h-5 w-px bg-line" />
                  {[
                    ["left", <AlignLeft key="left" size={11} />, "Align left"],
                    ["center", <AlignCenterHorizontal key="center" size={11} />, "Align centre"],
                    ["right", <AlignRight key="right" size={11} />, "Align right"],
                    ["top", <AlignTop key="top" size={11} />, "Align top"],
                    ["middle", <AlignCenterVertical key="middle" size={11} />, "Align middle"],
                    ["bottom", <AlignBottom key="bottom" size={11} />, "Align bottom"],
                  ].map(([alignment, icon, label]) => (
                    <button
                      key={String(alignment)}
                      type="button"
                      title={String(label)}
                      aria-label={String(label)}
                      onClick={() =>
                        api?.alignSelection(
                          alignment as
                            | "left"
                            | "center"
                            | "right"
                            | "top"
                            | "middle"
                            | "bottom",
                        )
                      }
                      className="grid h-6 w-5 place-items-center hover:bg-white/10"
                    >
                      {icon}
                    </button>
                  ))}
                  <button
                    type="button"
                    title="Distribute horizontally"
                    aria-label="Distribute horizontally"
                    onClick={() => api?.distributeSelection("horizontal")}
                    className="grid h-6 w-5 place-items-center hover:bg-white/10"
                  >
                    <ArrowsHorizontal size={11} />
                  </button>
                  <button
                    type="button"
                    title="Distribute vertically"
                    aria-label="Distribute vertically"
                    onClick={() => api?.distributeSelection("vertical")}
                    className="grid h-6 w-5 place-items-center hover:bg-white/10"
                  >
                    <ArrowsVertical size={11} />
                  </button>
                </>
              )}
              <span className="mx-0.5 h-5 w-px bg-line" />
              <button
                type="button"
                title="Duplicate"
                aria-label="Duplicate"
                onClick={() => void api?.duplicateSelected()}
                className="grid h-6 w-6 place-items-center hover:bg-white/10"
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                title={selection.locked ? "Unlock" : "Lock"}
                aria-label={selection.locked ? "Unlock" : "Lock"}
                aria-pressed={selection.locked}
                onClick={() => api?.toggleLock(selection.id)}
                className="grid h-6 w-6 place-items-center hover:bg-white/10"
              >
                {selection.locked ? (
                  <LockSimpleOpen size={12} />
                ) : (
                  <LockSimple size={12} />
                )}
              </button>
              <button
                type="button"
                title="Delete"
                aria-label="Delete"
                onClick={() => api?.deleteSelected()}
                className="grid h-6 w-6 place-items-center text-coral hover:bg-coral/10"
              >
                <Trash size={12} />
              </button>
              </fieldset>
              {selection.locked && (
                <button
                  type="button"
                  title="Unlock"
                  aria-label="Unlock"
                  onClick={() => api?.toggleLock(selection.id)}
                  className="h-6 border border-yellow/60 px-2 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-yellow hover:bg-yellow/10"
                >
                  Unlock
                </button>
              )}
              <span className="mx-0.5 h-5 w-px bg-line" />
              <button
                type="button"
                title="Hide floating toolbar"
                aria-label="Hide floating toolbar"
                onClick={() => onToggleFloatingToolbar?.()}
                className="grid h-6 w-5 place-items-center text-muted hover:bg-white/10 hover:text-chalk"
              >
                ×
              </button>
            </div>
          );
        })()}
      </div>
    );

    if (bare) return canvasBox;

    return (
      <div className="flex justify-center">
        <div className="border border-line bg-[#f3f2ea] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          {canvasBox}
        </div>
      </div>
    );
  },
);
