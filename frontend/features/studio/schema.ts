/**
 * Canonical persisted page format for the studio.
 *
 * A page is intentionally small and stable:
 *   schemaVersion: integer, bumped only for breaking document changes
 *   background: CSS colour, gradient, or background-image value
 *   elements: Fabric.js object JSON, each with a stable `id`
 *
 * Keep this module free of React and Fabric imports so it can be used while
 * hydrating, saving, and migrating pages.
 */
export const PAGE_SCHEMA_VERSION = 2;
export const DEFAULT_PAGE_BACKGROUND = "#f3f2ea";

export type PageDocument = {
  schemaVersion: number;
  background: string;
  elements: Record<string, unknown>[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeBackground(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_PAGE_BACKGROUND;
  return value.trim();
}

export function normalizePageDocument(raw: unknown): PageDocument {
  const value = isRecord(raw) ? raw : {};
  return {
    schemaVersion: PAGE_SCHEMA_VERSION,
    background: normalizeBackground(value.background),
    elements: Array.isArray(value.elements)
      ? value.elements.filter(isRecord)
      : [],
  };
}

export function createPageDocument(
  background: string = DEFAULT_PAGE_BACKGROUND,
): PageDocument {
  return {
    schemaVersion: PAGE_SCHEMA_VERSION,
    background: normalizeBackground(background),
    elements: [],
  };
}

export function canonicalPageDocument(document: PageDocument): PageDocument {
  return {
    schemaVersion: PAGE_SCHEMA_VERSION,
    background: normalizeBackground(document.background),
    elements: document.elements.filter(isRecord),
  };
}
