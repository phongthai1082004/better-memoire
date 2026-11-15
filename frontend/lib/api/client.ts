/**
 * Server-side backend client. Never import this from a Client Component:
 * the backend origin and the access token must stay on the server.
 */

const FALLBACK_BACKEND_URL = "http://localhost:5222";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, status = 500, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function getBackendUrl() {
  return (process.env.BACKEND_URL ?? FALLBACK_BACKEND_URL).replace(/\/+$/, "");
}

type ErrorBody = {
  detail?: string;
  title?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

function messageFromBody(body: unknown, status: number) {
  if (body && typeof body === "object") {
    const candidate = body as ErrorBody;
    if (candidate.message) return candidate.message;
    if (candidate.detail) return candidate.detail;
    if (candidate.errors) {
      const first = Object.values(candidate.errors).flat().find(Boolean);
      if (first) return first;
    }
    if (candidate.title) return candidate.title;
  }

  switch (status) {
    case 400:
      return "Please check the details and try again.";
    case 401:
      return "Email or password is incorrect.";
    case 403:
      return "This action is not available for your account.";
    case 404:
      return "We could not find that account.";
    case 409:
      return "An account with this email already exists.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return status >= 500
        ? "The studio service is unavailable right now. Please try again."
        : "Something went wrong. Please try again.";
  }
}

function fieldErrorsFromBody(body: unknown) {
  if (!body || typeof body !== "object") return undefined;
  const errors = (body as ErrorBody).errors;
  return errors && typeof errors === "object" ? errors : undefined;
}

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "The studio is offline right now. Please try again in a moment.",
      503,
    );
  }

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      messageFromBody(body, response.status),
      response.status,
      fieldErrorsFromBody(body),
    );
  }

  // Accept both the documented envelope and the raw ASP.NET Core response.
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    "success" in body
  ) {
    return (body as { data: T }).data;
  }

  return body as T;
}
