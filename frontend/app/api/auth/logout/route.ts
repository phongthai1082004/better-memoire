import { NextResponse } from "next/server";
import { logoutSession } from "@/lib/api/auth";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/auth/http";
import { getAccessToken } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const accessToken = await getAccessToken();
  if (accessToken) {
    try {
      const locale = await getLocale();
      await logoutSession(accessToken, locale);
    } catch {
      // Local logout still succeeds when the upstream session is already gone.
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Signed out.",
    data: null,
  });
  clearAuthCookies(response);
  return response;
}
