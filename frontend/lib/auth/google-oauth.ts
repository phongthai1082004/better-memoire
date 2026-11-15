import type { NextResponse } from "next/server";

export const GOOGLE_STATE_COOKIE = "bm_google_state";
export const GOOGLE_VERIFIER_COOKIE = "bm_google_verifier";
export const GOOGLE_OAUTH_MAX_AGE = 10 * 60;

export function getGoogleOAuthConfig(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    new URL("/api/auth/callback/google", request.url).toString();

  return { clientId, clientSecret, redirectUri };
}

export function googleOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_OAUTH_MAX_AGE,
  };
}

export function clearGoogleOAuthCookies(response: NextResponse) {
  const options = { ...googleOAuthCookieOptions(), maxAge: 0 };
  response.cookies.set(GOOGLE_STATE_COOKIE, "", options);
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, "", options);
}
