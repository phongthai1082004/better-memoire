import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/auth/http";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const FORWARDED_HEADERS = ["accept", "content-type", "idempotency-key"];

function backendBase() {
  return (process.env.BACKEND_URL ?? "http://localhost:5222").replace(/\/+$/, "");
}

async function handle(request: Request, context: RouteContext) {
  if (!SAFE_METHODS.has(request.method)) {
    const originError = assertSameOrigin(request);
    if (originError) return originError;
  }

  const { path } = await context.params;
  if (path[0] !== "api") {
    return NextResponse.json(
      { success: false, message: "Not found.", data: null },
      { status: 404 },
    );
  }

  const token = await getAccessToken();
  const locale = await getLocale();
  const target = `${backendBase()}/${path.join("/")}${new URL(request.url).search}`;

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("accept-language", locale);
  headers.set("accept-encoding", "identity");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const body =
    SAFE_METHODS.has(request.method) ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const payload = await upstream.arrayBuffer();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "The studio service is unavailable. Please try again.",
        data: null,
      },
      { status: 503 },
    );
  }
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
};
