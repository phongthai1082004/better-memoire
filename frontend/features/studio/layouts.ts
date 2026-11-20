import type { LayoutId } from "./fabric-canvas";

export type LayoutPreviewBlock = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "frame" | "image" | "text" | "title";
};

export type LayoutDefinition = {
  id: LayoutId;
  label: string;
  description: string;
  pages: 1 | 2;
  preview: LayoutPreviewBlock[][];
};

const frame = (
  x: number,
  y: number,
  w: number,
  h: number,
  kind: LayoutPreviewBlock["kind"] = "frame",
): LayoutPreviewBlock => ({ x, y, w, h, kind });

export const LAYOUTS: LayoutDefinition[] = [
  {
    id: "full",
    label: "One photo",
    description: "One large frame with a caption.",
    pages: 1,
    preview: [[frame(7, 7, 86, 70), frame(7, 82, 58, 4, "text")]],
  },
  {
    id: "two",
    label: "Two photos",
    description: "Two equal frames with a shared caption.",
    pages: 1,
    preview: [
      [frame(6, 8, 42, 68), frame(52, 8, 42, 68), frame(6, 82, 68, 4, "text")],
    ],
  },
  {
    id: "three",
    label: "Three photos",
    description: "One hero frame and two stacked frames.",
    pages: 1,
    preview: [
      [
        frame(6, 8, 46, 68),
        frame(56, 8, 38, 32),
        frame(56, 44, 38, 32),
        frame(6, 82, 68, 4, "text"),
      ],
    ],
  },
  {
    id: "text",
    label: "Text page",
    description: "A title and body copy without photographs.",
    pages: 1,
    preview: [
      [frame(10, 16, 74, 8, "title"), frame(10, 42, 64, 4, "text"), frame(10, 52, 58, 4, "text")],
    ],
  },
  {
    id: "cover",
    label: "Cover lettering",
    description: "Large display lettering with a supporting line.",
    pages: 1,
    preview: [[frame(8, 12, 72, 10, "title"), frame(8, 26, 44, 4, "text")]],
  },
  {
    id: "split",
    label: "Photo + story",
    description: "A tall photograph beside a short story column.",
    pages: 1,
    preview: [
      [
        frame(6, 8, 48, 72),
        frame(60, 12, 32, 7, "title"),
        frame(60, 28, 28, 4, "text"),
        frame(60, 38, 26, 4, "text"),
      ],
    ],
  },
  {
    id: "mosaic",
    label: "Photo mosaic",
    description: "Four frames arranged as a compact mosaic.",
    pages: 1,
    preview: [
      [
        frame(6, 8, 42, 34),
        frame(52, 8, 42, 34),
        frame(6, 46, 42, 34),
        frame(52, 46, 42, 34),
        frame(6, 84, 52, 4, "text"),
      ],
    ],
  },
  {
    id: "quote",
    label: "Quote page",
    description: "A centered quotation with a quiet caption.",
    pages: 1,
    preview: [
      [frame(14, 30, 58, 8, "title"), frame(22, 48, 48, 4, "text"), frame(26, 58, 34, 3, "text")],
    ],
  },
  {
    id: "spread-full",
    label: "Full-bleed spread",
    description: "A full photograph on each page.",
    pages: 2,
    preview: [
      [frame(6, 7, 88, 76), frame(6, 87, 42, 3, "text")],
      [frame(6, 7, 88, 76), frame(6, 87, 42, 3, "text")],
    ],
  },
  {
    id: "spread-story",
    label: "Photo / story spread",
    description: "A full photograph facing a title and story.",
    pages: 2,
    preview: [
      [frame(6, 7, 88, 78), frame(6, 88, 44, 3, "text")],
      [frame(10, 16, 72, 9, "title"), frame(10, 38, 60, 4, "text"), frame(10, 50, 52, 4, "text")],
    ],
  },
  {
    id: "spread-gallery",
    label: "Gallery spread",
    description: "Two photographs on each page with a shared caption.",
    pages: 2,
    preview: [
      [frame(5, 8, 42, 64), frame(52, 8, 42, 64), frame(5, 82, 44, 3, "text")],
      [frame(5, 8, 42, 64), frame(52, 8, 42, 64), frame(5, 82, 44, 3, "text")],
    ],
  },
  {
    id: "spread-cover",
    label: "Cover spread",
    description: "Display lettering opposite a full cover photograph.",
    pages: 2,
    preview: [
      [frame(10, 18, 64, 10, "title"), frame(10, 34, 40, 4, "text")],
      [frame(6, 7, 88, 80)],
    ],
  },
];

export function layoutsForPages(pages: 1 | 2): LayoutDefinition[] {
  return LAYOUTS.filter((layout) => layout.pages === pages);
}
