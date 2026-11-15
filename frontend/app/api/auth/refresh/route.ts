import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshSession } from "@/lib/api/auth";
import { REFRESH_COOKIE, setAuthCookies } from "@/lib/auth/cookies";
import { assertSameOrigin, errorResponse } from "@/lib/auth/http";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "No active session.", data: null },
      { status: 401 },
    );
  }

  try {
    const locale = await getLocale();
    const tokens = await refreshSession(refreshToken, locale);
    const response = NextResponse.json({
      success: true,
      message: "Session refreshed.",
      data: null,
    });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
