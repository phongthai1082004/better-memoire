/**
 * Sparse Fabric JSON helpers.
 *
 * Fabric emits a very large dense object graph. Most values are class defaults
 * and do not need to cross the network or be stored in PostgreSQL. We strip
 * those defaults before saving and hydrate them before handing the JSON back to
 * Fabric.
 *
 * This is a snapshot of the Fabric 7.x defaults. Keep it in sync with the
 * Fabric major used by the studio.
 */
import type { PageDocument } from "./schema";

export const SPARSE_VERSION = 1;
export const SPARSE_FABRIC_MAJOR = 7;

const NEVER_STRIP = new Set([
  "type",
  "version",
  "path",
  "src",
  "text",
  "clipPath",
  "objects",
  "customProperties",
  "_selId",
  "filters",
]);

type Defaults = Record<string, unknown>;

const COMMON_DEFAULTS: Defaults = {
  originX: "left",
  originY: "top",
  left: 0,
  top: 0,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  skewX: 0,
  skewY: 0,
  flipX: false,
  flipY: false,
  opacity: 1,
  visible: true,
  fill: "rgb(0,0,0)",
  fillRule: "nonzero",
  paintFirst: "fill",
  stroke: null,
  strokeWidth: 1,
  strokeDashArray: null,
  strokeDashOffset: 0,
  strokeLineCap: "butt",
  strokeLineJoin: "miter",
  strokeMiterLimit: 4,
  strokeUniform: false,
  shadow: null,
  backgroundColor: "",
  globalCompositeOperation: "source-over",
  objectCaching: true,
  statefullCache: false,
  noScaleCache: true,
  lockMovementX: false,
  lockMovementY: false,
  lockRotation: false,
  lockScalingX: false,
  lockScalingY: false,
  lockScalingFlip: false,
  hasControls: true,
  hasBorders: true,
  selectable: true,
  evented: true,
  hoverCursor: null,
  moveCursor: null,
  centeredScaling: false,
  centeredRotation: true,
  absolutePositioned: false,
  cropX: 0,
  cropY: 0,
  crossOrigin: "",
};

const TYPE_DEFAULTS: Record<string, Defaults> = {
  rect: { rx: 0, ry: 0 },
  image: {},
  "i-text": {
    fontSize: 16,
    fontFamily: "Times New Roman",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: "left",
    lineHeight: 1.16,
    charSpacing: 0,
    textBackgroundColor: "",
    styles: {},
    path: null,
  },
  textbox: {
    fontSize: 16,
    fontFamily: "Times New Roman",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: "left",
    lineHeight: 1.16,
    charSpacing: 0,
    textBackgroundColor: "",
    styles: {},
    path: null,
    minWidth: 20,
    dynamicMinWidth: 2,
    splitByGrapheme: false,
  },
  text: {
    fontSize: 16,
    fontFamily: "Times New Roman",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    overline: false,
    linethrough: false,
    textAlign: "left",
    lineHeight: 1.16,
    charSpacing: 0,
    textBackgroundColor: "",
    path: null,
  },
  group: {},
  path: {},
  line: { x1: 0, y1: 0, x2: 0, y2: 0 },
  polyline: {},
  polygon: {},
  circle: {},
  ellipse: {},
  triangle: {},
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every((key) => deepEqual(a[key], b[key]))
    );
  }
  return false;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundNumbers(value: unknown): unknown {
  if (typeof value === "number") return Number.isInteger(value) ? value : round(value);
  if (Array.isArray(value)) return value.map(roundNumbers);
  return value;
}

/** Remove default Fabric values from one object JSON. Mutates in place. */
export function stripFabricObject(object: Record<string, unknown>): void {
  const type = String(object.type || "").toLowerCase();
  const defaults = { ...COMMON_DEFAULTS, ...(TYPE_DEFAULTS[type] ?? {}) };

  for (const key of Object.keys(object)) {
    const value = object[key];

    if (key === "filters") {
      if (Array.isArray(value) && value.length === 0) delete object[key];
      continue;
    }

    if (key === "path" && Array.isArray(value)) {
      object[key] = roundNumbers(value);
      continue;
    }

    if (NEVER_STRIP.has(key)) {
      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (isPlainObject(child)) stripFabricObject(child);
        });
      } else if (isPlainObject(value) && typeof value.type === "string") {
        stripFabricObject(value);
      }
      continue;
    }

    if (key in defaults && deepEqual(value, defaults[key])) {
      delete object[key];
      continue;
    }

    if (typeof value === "number") object[key] = roundNumbers(value);
    else if (Array.isArray(value)) {
      object[key] = value.map((child) => {
        if (isPlainObject(child)) {
          stripFabricObject(child);
          return child;
        }
        return roundNumbers(child);
      });
    } else if (isPlainObject(value)) {
      stripFabricObject(value);
    }
  }

  if (object.studioFrame === false) delete object.studioFrame;
  if (object.studioLocked === false) delete object.studioLocked;
  if (object.studioFilter === "none") delete object.studioFilter;
  if (object.studioFrameOffsetX === 0) delete object.studioFrameOffsetX;
  if (object.studioFrameOffsetY === 0) delete object.studioFrameOffsetY;
  if (typeof object.studioOriginalSrc === "string" && object.studioOriginalSrc === object.src) {
    delete object.studioOriginalSrc;
  }
}

/** Write Fabric defaults back before loading into a canvas. Mutates in place. */
export function hydrateFabricObject(object: Record<string, unknown>): void {
  const type = String(object.type || "").toLowerCase();
  const defaults = { ...COMMON_DEFAULTS, ...(TYPE_DEFAULTS[type] ?? {}) };

  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in object)) {
      object[key] = value !== null && typeof value === "object"
        ? JSON.parse(JSON.stringify(value))
        : value;
    }
  }

  if (isPlainObject(object.clipPath) && typeof object.clipPath.type === "string") {
    hydrateFabricObject(object.clipPath);
  }
  if (Array.isArray(object.objects)) {
    object.objects.forEach((child) => {
      if (isPlainObject(child)) hydrateFabricObject(child);
    });
  }
}

export function stripPageDocument(document: PageDocument): PageDocument {
  const elements = document.elements.map((element) => {
    const copy = structuredClone(element);
    stripFabricObject(copy);
    return copy;
  });
  return {
    schemaVersion: document.schemaVersion,
    background: document.background,
    elements,
  };
}

export function hydratePageDocument(document: PageDocument): PageDocument {
  const elements = document.elements.map((element) => {
    const copy = structuredClone(element);
    hydrateFabricObject(copy);
    return copy;
  });
  return {
    schemaVersion: document.schemaVersion,
    background: document.background,
    elements,
  };
}

export function objectId(element: Record<string, unknown>, index: number): string {
  return typeof element.id === "string" && element.id
    ? element.id
    : `idx:${index}`;
}

export type ElementDelta = {
  changed: Record<string, unknown>[];
  removed: string[];
};

export function diffPageElements(
  previous: Record<string, unknown>[],
  next: Record<string, unknown>[],
): ElementDelta {
  const previousById = new Map(
    previous.map((element, index) => [objectId(element, index), JSON.stringify(element)]),
  );
  const nextIds = new Set(next.map((element, index) => objectId(element, index)));
  return {
    changed: next.filter(
      (element, index) =>
        previousById.get(objectId(element, index)) !== JSON.stringify(element),
    ),
    removed: [...previousById.keys()].filter((id) => !nextIds.has(id)),
  };
}
