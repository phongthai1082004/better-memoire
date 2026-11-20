export type PaperFormatKey = "A4" | "A5";

export type PaperFormat = {
  key: PaperFormatKey;
  label: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
  size: string;
  note: string;
};

export const PAPER_FORMATS: Record<PaperFormatKey, PaperFormat> = {
  A4: {
    key: "A4",
    label: "A4",
    widthMm: 210,
    heightMm: 297,
    widthPx: 840,
    heightPx: 1188,
    size: "210 × 297 mm",
    note: "The everyday photo-book page. More room for photographs and long captions.",
  },
  A5: {
    key: "A5",
    label: "A5",
    widthMm: 148,
    heightMm: 210,
    widthPx: 592,
    heightPx: 840,
    size: "148 × 210 mm",
    note: "Compact and light. Closer to a notebook you can carry anywhere.",
  },
};

export function paperFormatForBook(book: {
  paperWidth: number | null;
  paperHeight: number | null;
}): PaperFormat {
  if (book.paperWidth === 148 && book.paperHeight === 210) return PAPER_FORMATS.A5;
  return PAPER_FORMATS.A4;
}
