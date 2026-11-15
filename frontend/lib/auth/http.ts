import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { ApiError } from "@/lib/api/client";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  let originHost: string;
  let requestHost: string;

  try {
    originHost = new URL(origin).host;
    requestHost = new URL(request.url).host;
  } catch {
    return jsonError("Invalid request origin.", 403);
  }

  if (originHost !== requestHost) {
    return jsonError("Cross-origin requests are not allowed.", 403);
  }

  return null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function jsonError(
  message: string,
  status: number,
  errors?: Record<string, string[]> | null,
) {
  return NextResponse.json(
    { success: false, message, errors: errors ?? null, statusCode: status },
    { status },
  );
}

export function zodFieldErrors(error: ZodError) {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    fields[key] = [...(fields[key] ?? []), issue.message];
  }

  return fields;
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status, error.fieldErrors);
  }

  console.error("[auth] unexpected error", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
