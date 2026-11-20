"use client";

import { CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { PageDocument } from "./api";
import { FabricCanvas, type LayoutId, type StudioCanvasHandle, type StudioLayer } from "./fabric-canvas";
import { PAGE_SCHEMA_VERSION } from "./schema";
import { paperFormatForBook } from "./paper";
import { PageStrip } from "./page-strip";
import { PaperSizePicker } from "./paper-size-picker";
import { useStudioStore } from "./store";
import { StudioInspector } from "./studio-inspector";
import { StudioPanels } from "./studio-panels";
import { StudioToolRail } from "./studio-tool-rail";
import { StudioTopbar } from "./studio-topbar";

type SpreadElement = Record<string, unknown> & {
  id?: string;
  left?: number;
  top?: number;
  studioFrame?: boolean;
  studioFrameId?: string;
  spreadSide?: string;
  clipPath?: Record<string, unknown> & { left?: number; absolutePositioned?: boolean };
};

function shiftSpreadElement(element: SpreadElement, dx: number): SpreadElement {
  if (!dx) return element;
  const clipPath = element.clipPath;
  return {
    ...element,
    left: (element.left ?? 0) + dx,
    ...(clipPath
      ? {
          clipPath: {
            ...clipPath,
            left: (clipPath.left ?? 0) + dx,
          },
        }
      : {}),
  };
}

function combineSpreadPages(
  left: PageDocument,
  right: PageDocument,
  pageWidth: number,
): PageDocument {
  return {
    ...left,
    schemaVersion: PAGE_SCHEMA_VERSION,
    elements: [
      ...left.elements,
      ...right.elements.map((element) =>
        shiftSpreadElement(element as SpreadElement, pageWidth),
      ),
    ],
  };
}

function splitSpreadPages(
  spread: PageDocument,
  left: PageDocument,
  right: PageDocument,
  pageWidth: number,
): { left: PageDocument; right: PageDocument } {
  const leftElements: Record<string, unknown>[] = [];
  const rightElements: Record<string, unknown>[] = [];
  const frameSides = new Map<string, "left" | "right">();
  for (const raw of spread.elements) {
    const element = raw as SpreadElement;
    if (!element.studioFrame || typeof element.id !== "string") continue;
    frameSides.set(
      element.id,
      (element.left ?? 0) + ((element.width as number) ?? 0) / 2 >= pageWidth
        ? "right"
        : "left",
    );
  }
  for (const raw of spread.elements) {
    const element = raw as SpreadElement;
    const frameSide =
      typeof element.studioFrameId === "string"
        ? frameSides.get(element.studioFrameId)
        : undefined;
    const onRight =
      frameSide === "right" ||
      (frameSide !== "left" &&
        (element.spreadSide === "right" ||
          (element.spreadSide !== "left" &&
            (element.left ?? 0) + ((element.width as number) ?? 0) / 2 >= pageWidth)));
    if (onRight) {
      rightElements.push(shiftSpreadElement(element, -pageWidth));
    } else {
      leftElements.push(element);
    }
  }
  return {
    left: { ...left, schemaVersion: PAGE_SCHEMA_VERSION, elements: leftElements },
    right: { ...right, schemaVersion: PAGE_SCHEMA_VERSION, elements: rightElements },
  };
}

function spreadSideForId(
  id: string | undefined,
  left: PageDocument | null,
  right: PageDocument | null,
): "left" | "right" | null {
  if (!id) return null;
  if (left?.elements.some((element) => element.id === id)) return "left";
  if (right?.elements.some((element) => element.id === id)) return "right";
  return null;
}

export function StudioShell({ initialBookId }: { initialBookId?: string }) {
  const leftCanvasRef = useRef<StudioCanvasHandle | null>(null);
  const rightCanvasRef = useRef<StudioCanvasHandle | null>(null);
  const spreadCanvasRef = useRef<StudioCanvasHandle | null>(null);
  const loadedRef = useRef<string | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [spreadEpoch, setSpreadEpoch] = useState(0);
  const [layers, setLayers] = useState<StudioLayer[]>([]);
  const [layoutPages, setLayoutPages] = useState<1 | 2>(2);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(true);

  const book = useStudioStore((state) => state.book);
  const pages = useStudioStore((state) => state.pages);
  const activePageId = useStudioStore((state) => state.activePageId);
  const loading = useStudioStore((state) => state.loading);
  const savingPageId = useStudioStore((state) => state.savingPageId);
  const dirty = useStudioStore((state) => state.dirty);
  const error = useStudioStore((state) => state.error);
  const tool = useStudioStore((state) => state.tool);
  const viewMode = useStudioStore((state) => state.viewMode);
  const zoom = useStudioStore((state) => state.zoom);
  const selection = useStudioStore((state) => state.selection);

  const loadBook = useStudioStore((state) => state.loadBook);
  const selectPage = useStudioStore((state) => state.selectPage);
  const updatePage = useStudioStore((state) => state.updatePage);
  const undoPage = useStudioStore((state) => state.undoPage);
  const redoPage = useStudioStore((state) => state.redoPage);
  const savePage = useStudioStore((state) => state.savePage);
  const addPage = useStudioStore((state) => state.addPage);
  const duplicatePage = useStudioStore((state) => state.duplicatePage);
  const deletePage = useStudioStore((state) => state.deletePage);
  const renameBook = useStudioStore((state) => state.renameBook);
  const setTool = useStudioStore((state) => state.setTool);
  const setZoom = useStudioStore((state) => state.setZoom);
  const setSelection = useStudioStore((state) => state.setSelection);
  const setError = useStudioStore((state) => state.setError);

  useEffect(() => {
    if (!initialBookId || loadedRef.current === initialBookId) return;
    loadedRef.current = initialBookId;
    void loadBook(initialBookId);
  }, [initialBookId, loadBook]);

  const activePage = activePageId ? pages[activePageId] : null;
  const orderedPages = book
    ? [...book.pages].sort((a, b) => a.position - b.position)
    : [];
  const activeSummary = orderedPages.find((page) => page.id === activePageId);
  const spreadStart = Math.floor((activeSummary?.position ?? 0) / 2) * 2;
  const leftSummary = orderedPages.find((page) => page.position === spreadStart);
  const rightSummary = orderedPages.find((page) => page.position === spreadStart + 1);
  const leftPage = leftSummary ? pages[leftSummary.id] : null;
  const rightPage = rightSummary ? pages[rightSummary.id] : null;
  const leftId = leftSummary?.id;
  const rightId = rightSummary?.id;
  const activeCanvasRef =
    viewMode === "spread" && leftId && rightId
      ? spreadCanvasRef
      : rightId && activePageId === rightId
        ? rightCanvasRef
        : leftCanvasRef;
  const leftDirty = Boolean(leftId && dirty[leftId]);
  const rightDirty = Boolean(rightId && dirty[rightId]);
  const activeDirty = leftDirty || rightDirty;
  const saving = savingPageId !== null;
  const isSingle = viewMode === "single";
  const isSpread = viewMode === "spread";

  useEffect(() => {
    if (!leftDirty && !rightDirty) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (leftId && useStudioStore.getState().dirty[leftId]) {
          await savePage(leftId);
        }
        if (rightId && useStudioStore.getState().dirty[rightId]) {
          await savePage(rightId);
        }
      })();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    leftDirty,
    rightDirty,
    leftId,
    rightId,
    leftPage?.document,
    rightPage?.document,
    savePage,
  ]);

  useEffect(() => {
    function flush() {
      if (leftId && useStudioStore.getState().dirty[leftId]) void savePage(leftId);
      if (rightId && useStudioStore.getState().dirty[rightId]) void savePage(rightId);
    }
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [leftId, rightId, savePage]);

  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) return;

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      if (!element || !(event.target instanceof Node) || !element.contains(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const step = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom(useStudioStore.getState().zoom + step);
    }

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () =>
      window.removeEventListener("wheel", onWheel, { capture: true });
  }, [book, setZoom]);

  if (!initialBookId) return <PaperSizePicker />;

  if (loading && !book) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-board">
        <div className="flex items-center gap-3 text-muted">
          <CircleNotch size={20} className="animate-spin" aria-hidden="true" />
          <span className="hand text-[1.4rem]">Opening the studio…</span>
        </div>
      </main>
    );
  }

  if (error && !book) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-board px-6">
        <div className="max-w-md text-center">
          <WarningCircle size={32} className="mx-auto text-coral" aria-hidden="true" />
          <h1 className="mt-4 hand text-[2rem] text-chalk">The studio stayed shut.</h1>
          <p className="mt-3 text-body">{error}</p>
          <button
            type="button"
            onClick={() => {
              loadedRef.current = null;
              void loadBook(initialBookId);
            }}
            className="btn btn-outline btn-sm mt-6"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!book) return null;

  const format = paperFormatForBook(book);
  const displayHeight = 520;
  const displayWidth = Math.round((displayHeight * format.widthPx) / format.heightPx);
  const spreadDocument =
    leftPage && rightPage
      ? combineSpreadPages(leftPage.document, rightPage.document, displayWidth)
      : null;

  function handleSpreadDocumentChange(document: PageDocument) {
    if (!leftId || !rightId || !leftPage || !rightPage) return;
    const split = splitSpreadPages(
      document,
      leftPage.document,
      rightPage.document,
      displayWidth,
    );
    updatePage(leftId, { ...split.left, background: document.background });
    updatePage(rightId, { ...split.right, background: document.background });
  }

  function handleUndo() {
    if (isSpread && leftId && rightId) {
      undoPage(leftId);
      undoPage(rightId);
      setSpreadEpoch((value) => value + 1);
      return;
    }
    if (activePageId) undoPage(activePageId);
  }

  function handleRedo() {
    if (isSpread && leftId && rightId) {
      redoPage(leftId);
      redoPage(rightId);
      setSpreadEpoch((value) => value + 1);
      return;
    }
    if (activePageId) redoPage(activePageId);
  }

  async function flushSpread() {
    if (leftId && useStudioStore.getState().dirty[leftId]) await savePage(leftId);
    if (rightId && useStudioStore.getState().dirty[rightId]) await savePage(rightId);
  }

  async function handleSelectPage(pageId: string) {    if (pageId === activePageId) return;
    await flushSpread();
    setSelection(null);
    await selectPage(pageId);
  }

  async function handleActivatePage(pageId: string) {
    if (pageId !== activePageId) {
      setSelection(null);
      await selectPage(pageId);
    }
  }

  async function handleAddPage() {
    setBusy(true);
    try {
      await flushSpread();
      await addPage();
      await addPage();
      setSelection(null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not add pages.");
    } finally {
      setBusy(false);
    }
  }

  function handleApplyLayout(layout: LayoutId) {
    const pages: ("left" | "right")[] =
      layoutPages === 2 && rightId
        ? ["left", "right"]
        : [activePageId === rightId ? "right" : "left"];
    if (spreadCanvasRef.current && spreadDocument) {
      spreadCanvasRef.current.applyLayout(layout, pages);
      return;
    }
    activeCanvasRef.current?.applyLayout(layout);
  }

  function handleSpreadDelete(groupId: string) {
    if (viewMode === "spread") {
      spreadCanvasRef.current?.removeSpreadGroup(groupId);
      return;
    }
    leftCanvasRef.current?.removeSpreadGroup(groupId);
    rightCanvasRef.current?.removeSpreadGroup(groupId);
  }

  function handleFrameDelete(frameId: string) {
    const state = useStudioStore.getState();
    for (const [pageId, page] of Object.entries(state.pages)) {
      const hasLinkedImage = page.document.elements.some(
        (element) =>
          (element as { studioFrameId?: string }).studioFrameId === frameId,
      );
      if (!hasLinkedImage) continue;
      updatePage(pageId, {
        ...page.document,
        elements: page.document.elements.filter(
          (element) =>
            (element as { studioFrameId?: string }).studioFrameId !== frameId,
        ),
      });
    }
  }

  function handleSpreadMove(groupId: string, spreadX: number, spreadY: number, commit = false) {
    if (viewMode === "spread") {
      spreadCanvasRef.current?.syncSpreadHalf({
        groupId,
        spreadX,
        spreadY,
        commit,
      });
      return;
    }
    leftCanvasRef.current?.syncSpreadHalf({
      groupId,
      spreadX,
      spreadY,
      commit,
    });
    rightCanvasRef.current?.syncSpreadHalf({
      groupId,
      spreadX,
      spreadY,
      commit,
    });
  }

  async function handleDuplicatePages(pageIds: string[]) {
    setBusy(true);
    try {
      await flushSpread();
      for (const pageId of pageIds) {
        if (useStudioStore.getState().activePageId !== pageId) {
          await selectPage(pageId);
        }
        await duplicatePage();
      }
      setSelection(null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not duplicate the pages.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePages(pageIds: string[]) {
    if (book && book.pageCount - pageIds.length < 2) return;
    setBusy(true);
    try {
      await flushSpread();
      for (const pageId of pageIds) {
        await deletePage(pageId);
      }
      setSelection(null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not delete the pages.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-board">
      <StudioTopbar
        book={book}
        format={format}
        zoom={zoom}
        dirty={activeDirty}
        saving={saving}
        canUndo={Boolean(activePage?.history.length)}
        canRedo={Boolean(activePage?.future.length)}
        onZoom={setZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={() => void flushSpread()}
        onRename={(title) => void renameBook(title)}
      />

      {error && (
        <div className="flex items-center justify-between gap-4 border-b border-coral/40 bg-coral/10 px-4 py-2 text-[0.8rem] text-coral">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-mono text-[0.6rem] uppercase tracking-[0.1em] hover:text-chalk"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <StudioToolRail tool={tool} onTool={setTool} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <aside className="block max-h-[38dvh] w-full shrink-0 overflow-y-auto border-b border-line-soft bg-board-deep/35 md:w-[250px] md:max-h-none md:border-b-0 md:border-r">
              <StudioPanels
                tool={tool}
                canvasRef={activeCanvasRef}
                pageBackground={activePage?.document.background ?? "#f3f2ea"}
                layers={layers}
                selectedId={selection?.id}
                onSelectLayer={(id) => activeCanvasRef.current?.selectLayer(id)}
                onToggleLayerVisibility={(id) =>
                  activeCanvasRef.current?.toggleLayerVisibility(id)
                }
                onToggleLayerLock={(id) => activeCanvasRef.current?.toggleLayerLock(id)}
                onMoveLayer={(id, direction) =>
                  activeCanvasRef.current?.moveLayer(id, direction)
                }
                layoutPages={layoutPages}
                onLayoutPages={setLayoutPages}
                onApplyLayout={handleApplyLayout}
              />
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {activePage && activePageId && (
                <div className="flex h-11 shrink-0 flex-wrap items-center gap-1.5 border-b border-line-soft bg-board px-4">
                  <button
                    type="button"
                    disabled={selection?.locked}
                    onClick={() => void activeCanvasRef.current?.duplicateSelected()}
                    className="border border-line px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-body transition-colors hover:border-yellow hover:text-yellow disabled:opacity-40 disabled:hover:border-line disabled:hover:text-body"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    disabled={selection?.locked}
                    onClick={() => activeCanvasRef.current?.deleteSelected()}
                    className="border border-line px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-body transition-colors hover:border-yellow hover:text-yellow disabled:opacity-40 disabled:hover:border-line disabled:hover:text-body"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    disabled={selection?.locked}
                    onClick={() => activeCanvasRef.current?.groupSelected()}
                    className="border border-line px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-body transition-colors hover:border-yellow hover:text-yellow disabled:opacity-40 disabled:hover:border-line disabled:hover:text-body"
                  >
                    Group
                  </button>
                  <button
                    type="button"
                    disabled={selection?.locked}
                    onClick={() => activeCanvasRef.current?.ungroupSelected()}
                    className="border border-line px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-body transition-colors hover:border-yellow hover:text-yellow disabled:opacity-40 disabled:hover:border-line disabled:hover:text-body"
                  >
                    Ungroup
                  </button>
                  {selection && (
                    <button
                      type="button"
                      onClick={() => activeCanvasRef.current?.toggleLock(selection.id)}
                      className="border border-line px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-body transition-colors hover:border-yellow hover:text-yellow"
                    >
                      {selection.locked ? "Unlock" : "Lock"}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={showFloatingToolbar}
                    onClick={() => setShowFloatingToolbar((value) => !value)}
                    className={`border px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.1em] transition-colors ${
                      showFloatingToolbar
                        ? "border-yellow bg-yellow/10 text-yellow"
                        : "border-line text-body hover:border-yellow hover:text-yellow"
                    }`}
                  >
                    Tools {showFloatingToolbar ? "On" : "Off"}
                  </button>
                </div>
              )}

              <section
                ref={workspaceRef}
                aria-label="Canvas workspace"
                className="studio-workspace min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-6"
              >
                <div className="flex min-h-full min-w-full items-center justify-center">
                  {activePage && activePageId ? (
                    <>
                    {spreadDocument && leftId && rightId && leftPage && rightPage && (
                      <div
                        className={
                          isSpread
                            ? "relative min-w-fit bg-[#f3f2ea] shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
                            : "hidden"
                        }
                      >
                        <FabricCanvas
                          key={`spread-${leftId}-${rightId}-${viewMode}-${spreadEpoch}`}
                          ref={spreadCanvasRef}
                          page={spreadDocument}
                          width={displayWidth * 2}
                          height={displayHeight}
                          pageWidth={displayWidth}
                          spreadMode
                          zoom={zoom}
                          bare
                          onChange={handleSpreadDocumentChange}
                          onSelectionChange={(value) => {
                            const side = spreadSideForId(
                              value?.id,
                              leftPage.document,
                              rightPage.document,
                            );
                            if (side === "left") void handleActivatePage(leftId);
                            if (side === "right") void handleActivatePage(rightId);
                            setSelection(value);
                          }}
                          onSpreadDelete={handleSpreadDelete}
                          onSpreadMove={(groupId, x, y) => handleSpreadMove(groupId, x, y)}
                          onSpreadCommit={(groupId, x, y) => handleSpreadMove(groupId, x, y, true)}
                          onUndo={handleUndo}
                          onRedo={handleRedo}
                          onLayersChange={isSingle ? undefined : setLayers}
                          onFrameDelete={handleFrameDelete}
                          showFloatingToolbar={showFloatingToolbar}
                          onToggleFloatingToolbar={() =>
                            setShowFloatingToolbar((value) => !value)
                          }
                          active={isSpread}
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-1/2 z-40 w-px -translate-x-1/2 bg-black/10"
                        />
                        {tool === "layouts" &&
                          layoutPages === 1 &&
                          leftId &&
                          rightId &&
                          activePageId && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleActivatePage(
                                  activePageId === leftId ? rightId : leftId,
                                )
                              }
                              aria-label={`Edit page ${
                                activePageId === leftId
                                  ? (rightSummary?.position ?? 1) + 1
                                  : (leftSummary?.position ?? 0) + 1
                              }`}
                              className="absolute inset-y-0 z-20 grid place-items-center bg-board-deep/60 text-center backdrop-blur-[1px] transition-colors hover:bg-board-deep/70"
                              style={{
                                left: activePageId === leftId ? "50%" : 0,
                                width: "50%",
                              }}
                            >
                              <span className="px-4">
                                <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-chalk/80">
                                  Page{" "}
                                  {activePageId === leftId
                                    ? (rightSummary?.position ?? 1) + 1
                                    : (leftSummary?.position ?? 0) + 1}
                                </span>
                                <span className="mt-1 block hand text-[1.35rem] text-chalk">
                                  Click to edit
                                </span>
                              </span>
                            </button>
                          )}
                      </div>
                    )}
                    <div
                      className={`min-w-fit items-start justify-center bg-[#f3f2ea] shadow-[0_24px_80px_rgba(0,0,0,0.38)] ${
                        isSpread && spreadDocument ? "hidden" : "flex"
                      }`}
                    >
                    <div className="relative">
                      {leftSummary && leftPage && leftId ? (
                        <FabricCanvas
                          key={`${leftId}-${leftPage.revision}`}
                          ref={leftCanvasRef}
                          page={leftPage.document}
                          width={displayWidth}
                          height={displayHeight}
                          zoom={zoom}
                          bare
                          onChange={(document) => updatePage(leftId, document)}
                          onSelectionChange={(value) => {
                            if (value) void handleActivatePage(leftId);
                            setSelection(value);
                          }}
                          onActivate={() => void handleActivatePage(leftId)}
                          onSpreadDelete={handleSpreadDelete}
                          onSpreadMove={(groupId, x, y) => handleSpreadMove(groupId, x, y)}
                          onSpreadCommit={(groupId, x, y) => handleSpreadMove(groupId, x, y, true)}
                          onUndo={() => undoPage(leftId)}
                          onRedo={() => redoPage(leftId)}
                          onLayersChange={
                            isSpread && spreadDocument
                              ? undefined
                              : (next) => {
                                  if (activePageId === leftId) setLayers(next);
                                }
                          }
                          onFrameDelete={handleFrameDelete}
                          showFloatingToolbar={showFloatingToolbar}
                          onToggleFloatingToolbar={() =>
                            setShowFloatingToolbar((value) => !value)
                          }
                          active={
                            (!isSpread || !spreadDocument) &&
                            activePageId === leftId
                          }
                        />
                      ) : (
                        <div
                          style={{
                            width: displayWidth * zoom,
                            height: displayHeight * zoom,
                          }}
                        />
                      )}
                      {isSingle && leftId && activePageId !== leftId && (
                        <button
                          type="button"
                          onClick={() => void handleActivatePage(leftId)}
                          aria-label={`Edit page ${(leftSummary?.position ?? 0) + 1}`}
                          className="absolute inset-0 z-20 grid place-items-center bg-board-deep/60 text-center backdrop-blur-[1px] transition-colors hover:bg-board-deep/70"
                        >
                          <span className="px-4">
                            <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-chalk/80">
                              Page {(leftSummary?.position ?? 0) + 1}
                            </span>
                            <span className="mt-1 block hand text-[1.35rem] text-chalk">
                              Click to edit
                            </span>
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      {rightSummary && rightPage && rightId ? (
                        <FabricCanvas
                          key={`${rightId}-${rightPage.revision}`}
                          ref={rightCanvasRef}
                          page={rightPage.document}
                          width={displayWidth}
                          height={displayHeight}
                          zoom={zoom}
                          bare
                          onChange={(document) => updatePage(rightId, document)}
                          onSelectionChange={(value) => {
                            if (value) void handleActivatePage(rightId);
                            setSelection(value);
                          }}
                          onActivate={() => void handleActivatePage(rightId)}
                          onSpreadDelete={handleSpreadDelete}
                          onSpreadMove={(groupId, x, y) => handleSpreadMove(groupId, x, y)}
                          onSpreadCommit={(groupId, x, y) => handleSpreadMove(groupId, x, y, true)}
                          onUndo={() => undoPage(rightId)}
                          onRedo={() => redoPage(rightId)}
                          onLayersChange={
                            isSpread && spreadDocument
                              ? undefined
                              : (next) => {
                                  if (activePageId === rightId) setLayers(next);
                                }
                          }
                          onFrameDelete={handleFrameDelete}
                          showFloatingToolbar={showFloatingToolbar}
                          onToggleFloatingToolbar={() =>
                            setShowFloatingToolbar((value) => !value)
                          }
                          active={
                            (!isSpread || !spreadDocument) &&
                            activePageId === rightId
                          }
                        />
                      ) : (
                        <div
                          className="bg-[#f3f2ea]/40"
                          style={{
                            width: displayWidth * zoom,
                            height: displayHeight * zoom,
                          }}
                        />
                      )}
                      {isSingle && rightId && activePageId !== rightId && (
                        <button
                          type="button"
                          onClick={() => void handleActivatePage(rightId)}
                          aria-label={`Edit page ${(rightSummary?.position ?? 0) + 1}`}
                          className="absolute inset-0 z-20 grid place-items-center bg-board-deep/60 text-center backdrop-blur-[1px] transition-colors hover:bg-board-deep/70"
                        >
                          <span className="px-4">
                            <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-chalk/80">
                              Page {(rightSummary?.position ?? 0) + 1}
                            </span>
                            <span className="mt-1 block hand text-[1.35rem] text-chalk">
                              Click to edit
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  </>
                ) : (
                  <p className="mt-10 text-center text-muted">No page is open.</p>
                )}
                </div>
              </section>
            </div>

            <StudioInspector
              book={book}
              format={format}
              selection={selection}
              pageVersion={activePage?.version ?? 0}
              background={activePage?.document.background ?? "#f3f2ea"}
              onUpdate={(patch) => activeCanvasRef.current?.updateSelected(patch)}
              onFilter={(preset) => activeCanvasRef.current?.applyFilter(preset)}
            />
          </div>

          <PageStrip
            book={book}
            activePageId={activePageId}
            dirty={dirty}
            busy={busy}
            onSelect={(pageId) => void handleSelectPage(pageId)}
            onAdd={() => void handleAddPage()}
            onDuplicate={(pageIds) => void handleDuplicatePages(pageIds)}
            onDelete={(pageIds) => void handleDeletePages(pageIds)}
          />
        </div>
      </div>
    </main>
  );
}
