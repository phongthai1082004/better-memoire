import { apiRequest } from "@/lib/api/app";
import {
  canonicalPageDocument,
  normalizePageDocument,
  PAGE_SCHEMA_VERSION,
  type PageDocument,
} from "./schema";
import { hydratePageDocument, stripPageDocument, type ElementDelta } from "./sparse-json";

export type { PageDocument } from "./schema";

export type PageSummary = {
  id: string;
  position: number;
  version: number;
  schemaVersion: number;
};

export type BookManifest = {
  id: string;
  sampleBookId: string | null;
  title: string;
  type: string;
  style: string;
  font: string;
  cover: string;
  coverUrl: string | null;
  paperHeight: number | null;
  paperWidth: number | null;
  pageCount: number;
  schemaVersion: number;
  lastEventSeq: number;
  pages: PageSummary[];
};

export type BookPage = {
  id: string;
  position: number;
  version: number;
  schemaVersion: number;
  content: unknown;
  updatedAt: string;
};

export type PagePatchOperation = {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
};

export function hydratePage(raw: unknown): PageDocument {
  return hydratePageDocument(normalizePageDocument(raw));
}

export async function listBooks() {
  return apiRequest<BookManifest[]>("/api/v1/books");
}

export async function createBook(format: {
  widthMm: number;
  heightMm: number;
}) {
  return apiRequest<BookManifest>("/api/v1/books", {
    method: "POST",
    body: JSON.stringify({
      title: "Untitled book",
      type: "photo-book",
      style: "classic",
      font: "Alegreya Sans",
      cover: "cloth",
      coverUrl: null,
      paperHeight: format.heightMm,
      paperWidth: format.widthMm,
      sampleBookId: null,
    }),
  });
}

export async function updateBookTitle(bookId: string, title: string) {
  return apiRequest<BookManifest>(`/api/v1/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deletePage(bookId: string, pageId: string) {
  return apiRequest<BookManifest>(`/api/v1/books/${bookId}/pages/${pageId}`, {
    method: "DELETE",
  });
}

export async function reorderPages(bookId: string, pageIds: string[]) {
  return apiRequest<BookManifest>(`/api/v1/books/${bookId}/pages/order`, {
    method: "PATCH",
    body: JSON.stringify({ pageIds }),
  });
}

export async function getBook(bookId: string) {
  return apiRequest<BookManifest>(`/api/v1/books/${bookId}`);
}

export async function getPageWindow(bookId: string, from: number, to: number) {
  return apiRequest<BookPage[]>(
    `/api/v1/books/${bookId}/pages?from=${from}&to=${to}`,
  );
}

export type StudioUserImage = {
  id: string;
  url: string;
  publicId: string;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  mimeType: string | null;
  originalName: string | null;
  createdOnUtc: string;
};

type UploadTicket = {
  uploadUrl: string;
  token: string;
  folder: string;
  expiry: number;
};

export async function listStudioImages(limit = 24) {
  return apiRequest<StudioUserImage[]>(`/api/v1/media/images?limit=${limit}`);
}

const GALLERY_UPLOAD = {
  maxSide: 4000,
  minBytes: 2 * 1024 * 1024,
  maxBytes: 4 * 1024 * 1024,
};

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/png" });
    const png = (Array.isArray(converted) ? converted[0] : converted) as Blob;
    return createImageBitmap(png);
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image."))),
      "image/jpeg",
      quality,
    );
  });
}

async function normalizeImage(file: File) {
  const bitmap = await decodeImage(file);
  const withinDimensions =
    Math.max(bitmap.width, bitmap.height) <= GALLERY_UPLOAD.maxSide;
  if (
    file.type === "image/jpeg" &&
    file.size >= GALLERY_UPLOAD.minBytes &&
    file.size <= GALLERY_UPLOAD.maxBytes &&
    withinDimensions
  ) {
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { blob: file as Blob, ...dimensions };
  }

  const scale = Math.min(1, GALLERY_UPLOAD.maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not prepare that image.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let low = 0.7;
  let high = 0.97;
  let quality = 0.92;
  let blob = await canvasToJpeg(canvas, quality);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (
      blob.size <= GALLERY_UPLOAD.maxBytes &&
      blob.size >= GALLERY_UPLOAD.minBytes
    ) {
      break;
    }
    if (blob.size > GALLERY_UPLOAD.maxBytes) {
      high = quality;
      quality = (low + quality) / 2;
    } else {
      low = quality;
      quality = (quality + high) / 2;
    }
    blob = await canvasToJpeg(canvas, quality);
  }
  return { blob, width, height };
}

export async function uploadStudioImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  const normalized = await normalizeImage(file);
  const ticket = await apiRequest<UploadTicket>(
    "/api/v1/media/upload-signature?type=gallery",
  );
  const endpoint = ticket.uploadUrl.endsWith("/upload")
    ? ticket.uploadUrl
    : `${ticket.uploadUrl.replace(/\/$/, "")}/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": normalized.blob.type || "image/jpeg",
      "X-Echotrace-Token": ticket.token,
      "X-Echotrace-Folder": ticket.folder,
      "X-Echotrace-Expiry": String(ticket.expiry),
    },
    body: normalized.blob,
  });
  if (!response.ok) {
    throw new Error("Image upload failed. Please try another image.");
  }
  const uploaded = (await response.json()) as {
    url?: string;
    publicId?: string;
    thumbUrl?: string;
    width?: number;
    height?: number;
    size?: number;
  };
  if (!uploaded.url || !uploaded.publicId) {
    throw new Error("The image service returned an invalid response.");
  }
  return apiRequest<StudioUserImage>("/api/v1/media/images", {
    method: "POST",
    body: JSON.stringify({
      url: uploaded.url,
      publicId: uploaded.publicId,
      thumbUrl: uploaded.thumbUrl ?? null,
      width: uploaded.width ?? normalized.width,
      height: uploaded.height ?? normalized.height,
      size: uploaded.size ?? normalized.blob.size,
      mimeType: normalized.blob.type || "image/jpeg",
      originalName: file.name,
      contentHash: null,
    }),
  });
}

export async function addPage(bookId: string) {
  return apiRequest<BookPage>(`/api/v1/books/${bookId}/pages`, {
    method: "POST",
  });
}

export async function patchPage(
  bookId: string,
  pageId: string,
  baseVersion: number,
  document: PageDocument,
  elementDelta?: ElementDelta,
) {
  const page = canonicalPageDocument(stripPageDocument(document));
  const operations: PagePatchOperation[] = [
    {
      op: "replace",
      path: "/schemaVersion",
      value: PAGE_SCHEMA_VERSION,
    },
    {
      op: "replace",
      path: "/background",
      value: page.background,
    },
  ];
  if (!elementDelta) {
    operations.push({
      op: "replace",
      path: "/elements",
      value: page.elements,
    });
  }

  return apiRequest<BookPage>(`/api/v1/books/${bookId}/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      baseVersion,
      clientMutationId: crypto.randomUUID(),
      operations,
      ...(elementDelta ? { elementDelta } : {}),
    }),
  });
}
