import { create } from "zustand";
import {
  addPage as addPageRequest,
  createBook as createBookRequest,
  deletePage as deletePageRequest,
  getBook,
  getPageWindow,
  hydratePage,
  patchPage,
  reorderPages,
  updateBookTitle,
  type BookManifest,
  type PageDocument,
} from "./api";
import type { PaperFormatKey } from "./paper";
import { diffPageElements, stripPageDocument } from "./sparse-json";

export type StudioTool =
  | "layouts"
  | "photos"
  | "text"
  | "shapes"
  | "frames"
  | "filter"
  | "background"
  | "layers";

export type StudioViewMode = "single" | "spread";

export type StudioSelection = {
  id: string;
  type: string;
  fill: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
  textAlign: string;
  charSpacing?: number;
  lineHeight?: number;
  locked: boolean;
  isImage: boolean;
  isText: boolean;
  filter?: string;
} | null;

type PageState = {
  document: PageDocument;
  version: number;
  position: number;
  revision: number;
  history: PageDocument[];
  future: PageDocument[];
  lastSaved?: PageDocument;
};

type StudioState = {
  book: BookManifest | null;
  pages: Record<string, PageState>;
  activePageId: string | null;
  loading: boolean;
  savingPageId: string | null;
  dirty: Record<string, boolean>;
  error: string | null;
  tool: StudioTool;
  viewMode: StudioViewMode;
  zoom: number;
  selection: StudioSelection;

  createBook: (format: PaperFormatKey, widthMm: number, heightMm: number) => Promise<string>;
  loadBook: (bookId: string) => Promise<void>;
  loadWindow: (pageId: string) => Promise<void>;
  selectPage: (pageId: string) => Promise<void>;
  updatePage: (pageId: string, document: PageDocument, record?: boolean) => void;
  undoPage: (pageId: string) => void;
  redoPage: (pageId: string) => void;
  savePage: (pageId: string) => Promise<boolean>;
  addPage: () => Promise<void>;
  duplicatePage: () => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  movePage: (pageId: string, direction: -1 | 1) => Promise<void>;
  renameBook: (title: string) => Promise<void>;
  setTool: (tool: StudioTool) => void;
  setViewMode: (mode: StudioViewMode) => void;
  setZoom: (zoom: number) => void;
  setSelection: (selection: StudioSelection) => void;
  setError: (error: string | null) => void;
};

const HISTORY_LIMIT = 40;

function pageState(document: PageDocument, version: number, position: number): PageState {
  return {
    document,
    lastSaved: stripPageDocument(document),
    version,
    position,
    revision: 0,
    history: [],
    future: [],
  };
}

function sortPages(book: BookManifest) {
  return {
    ...book,
    pages: [...book.pages].sort((a, b) => a.position - b.position),
  };
}

function mergeBookPage(
  book: BookManifest,
  pageId: string,
  position: number,
  version: number,
  schemaVersion: number,
): BookManifest {
  if (book.pages.some((page) => page.id === pageId)) return book;
  return sortPages({
    ...book,
    pageCount: book.pageCount + 1,
    pages: [...book.pages, { id: pageId, position, version, schemaVersion }],
  });
}

export const useStudioStore = create<StudioState>((set, get) => ({
  book: null,
  pages: {},
  activePageId: null,
  loading: true,
  savingPageId: null,
  dirty: {},
  error: null,
  tool: "layouts",
  viewMode: "spread",
  zoom: 1,
  selection: null,

  async createBook(format, widthMm, heightMm) {
    void format;
    const book = await createBookRequest({ widthMm, heightMm });
    return book.id;
  },

  async loadBook(bookId) {
    set({ loading: true, error: null, selection: null });
    try {
      const book = sortPages(await getBook(bookId));
      const firstPage = book.pages[0] ?? null;

      if (!firstPage) {
        set({ book, pages: {}, activePageId: null, loading: false });
        return;
      }

      const from = 0;
      const to = Math.max(firstPage.position + 2, Math.min(book.pageCount + 2, 6));
      const loaded = await getPageWindow(book.id, from, to);
      const pages: Record<string, PageState> = {};

      for (const page of loaded) {
        const document = hydratePage(page.content);
        pages[page.id] = pageState(document, page.version, page.position);
      }

      set({
        book,
        pages,
        activePageId: pages[firstPage.id] ? firstPage.id : loaded[0]?.id ?? null,
        loading: false,
        dirty: {},
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Could not open this book.",
      });
    }
  },

  async loadWindow(pageId) {
    const { book, pages } = get();
    if (!book) return;
    const summary = book.pages.find((page) => page.id === pageId);
    if (!summary) return;

    const from = Math.max(0, summary.position - 2);
    const to = Math.min(book.pageCount - 1, summary.position + 2);
    const loaded = await getPageWindow(book.id, from, to);
    const nextPages = { ...pages };

    for (const page of loaded) {
      if (get().dirty[page.id] && nextPages[page.id]) continue;
      const document = hydratePage(page.content);
      nextPages[page.id] = pageState(document, page.version, page.position);
    }

    set({ pages: nextPages });
  },

  async selectPage(pageId) {
    set({ activePageId: pageId, selection: null });
    if (!get().pages[pageId]) await get().loadWindow(pageId);
  },

  updatePage(pageId, document, record = true) {
    const current = get().pages[pageId];
    if (!current) return;

    set((state) => ({
      pages: {
        ...state.pages,
        [pageId]: {
          ...current,
          document,
          history: record
            ? [...current.history, current.document].slice(-HISTORY_LIMIT)
            : current.history,
          future: record ? [] : current.future,
        },
      },
      dirty: { ...state.dirty, [pageId]: true },
    }));
  },

  undoPage(pageId) {
    const page = get().pages[pageId];
    if (!page?.history.length) return;
    const previous = page.history[page.history.length - 1];
    set((state) => ({
      pages: {
        ...state.pages,
        [pageId]: {
          ...page,
          document: previous,
          history: page.history.slice(0, -1),
          future: [...page.future, page.document].slice(-HISTORY_LIMIT),
          revision: page.revision + 1,
        },
      },
      dirty: { ...state.dirty, [pageId]: true },
      selection: null,
    }));
  },

  redoPage(pageId) {
    const page = get().pages[pageId];
    if (!page?.future.length) return;
    const next = page.future[page.future.length - 1];
    set((state) => ({
      pages: {
        ...state.pages,
        [pageId]: {
          ...page,
          document: next,
          history: [...page.history, page.document].slice(-HISTORY_LIMIT),
          future: page.future.slice(0, -1),
          revision: page.revision + 1,
        },
      },
      dirty: { ...state.dirty, [pageId]: true },
      selection: null,
    }));
  },

  async savePage(pageId) {
    const { book, pages, dirty, savingPageId } = get();
    const page = pages[pageId];
    if (!book || !page || !dirty[pageId] || savingPageId) return false;

    set({ savingPageId: pageId, error: null });
    try {
      const current = stripPageDocument(page.document);
      const delta = page.lastSaved
        ? diffPageElements(page.lastSaved.elements, current.elements)
        : null;
      const useDelta = Boolean(
        delta &&
          delta.changed.length + delta.removed.length < current.elements.length,
      );
      const saved = await patchPage(
        book.id,
        pageId,
        page.version,
        current,
        useDelta ? delta ?? undefined : undefined,
      );
      const latest = get().pages[pageId];
      const hasNewerChanges = Boolean(latest && latest.document !== page.document);

      set((state) => ({
        book: state.book
          ? {
              ...state.book,
              pages: state.book.pages.map((summary) =>
                summary.id === pageId
                  ? { ...summary, version: saved.version }
                  : summary,
              ),
            }
          : state.book,
        pages: {
          ...state.pages,
          [pageId]: {
            ...(state.pages[pageId] ?? page),
            version: saved.version,
            lastSaved: current,
            document: hasNewerChanges
              ? state.pages[pageId]?.document ?? hydratePage(saved.content)
              : hydratePage(saved.content),
          },
        },
        dirty: { ...state.dirty, [pageId]: hasNewerChanges },
        savingPageId: null,
      }));
      return true;
    } catch (error) {
      set({
        savingPageId: null,
        error: error instanceof Error ? error.message : "Could not save this page.",
      });
      return false;
    }
  },

  async addPage() {
    const { book } = get();
    if (!book) return;
    const page = await addPageRequest(book.id);
    set((state) => ({
      book: state.book
        ? mergeBookPage(
            state.book,
            page.id,
            page.position,
            page.version,
            page.schemaVersion,
          )
        : state.book,
      pages: {
        ...state.pages,
        [page.id]: pageState(hydratePage(page.content), page.version, page.position),
      },
      activePageId: page.id,
      dirty: { ...state.dirty, [page.id]: false },
      selection: null,
    }));
  },

  async duplicatePage() {
    const { book, activePageId, pages } = get();
    const source = activePageId ? pages[activePageId] : null;
    if (!book || !source) return;

    const page = await addPageRequest(book.id);
    const saved = await patchPage(book.id, page.id, page.version, source.document);
    set((state) => ({
      book: state.book
        ? mergeBookPage(
            state.book,
            page.id,
            page.position,
            saved.version,
            page.schemaVersion,
          )
        : state.book,
      pages: {
        ...state.pages,
        [page.id]: pageState(hydratePage(saved.content), saved.version, page.position),
      },
      activePageId: page.id,
      selection: null,
    }));
  },

  async deletePage(pageId) {
    const { book, pages, activePageId } = get();
    if (!book || book.pageCount <= 1) return;

    const manifest = await deletePageRequest(book.id, pageId);
    const nextPages = { ...pages };
    delete nextPages[pageId];
    const remaining = manifest.pages.filter((page) => page.id !== pageId);
    const fallback = remaining.find((page) => page.position >= 0)?.id ?? null;

    set({
      book: sortPages(manifest),
      pages: nextPages,
      activePageId:
        activePageId === pageId ? fallback : activePageId,
      selection: null,
    });
  },

  async movePage(pageId, direction) {
    const { book } = get();
    if (!book) return;
    const ordered = [...book.pages].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((page) => page.id === pageId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;

    const [moved] = ordered.splice(index, 1);
    ordered.splice(target, 0, moved);
    const manifest = await reorderPages(book.id, ordered.map((page) => page.id));
    set({ book: sortPages(manifest) });
  },

  async renameBook(title) {
    const { book } = get();
    if (!book) return;
    const updated = await updateBookTitle(book.id, title);
    set({ book: { ...book, title: updated.title } });
  },

  setTool: (tool) => set({ tool }),
  setViewMode: (viewMode) => set({ viewMode, selection: null }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.35, zoom)) }),
  setSelection: (selection) => set({ selection }),
  setError: (error) => set({ error }),
}));
