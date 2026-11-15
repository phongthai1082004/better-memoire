import { NextRequest, NextResponse } from "next/server";
import { loginWithGoogleIdToken } from "@/lib/api/auth";
import { setAuthCookies } from "@/lib/auth/cookies";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  clearGoogleOAuthCookies,
  getGoogleOAuthConfig,
} from "@/lib/auth/google-oauth";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

function redirectToAuth(request: Request, reason: string) {
  const response = NextResponse.redirect(
    new URL(`/auth?google=${reason}`, request.url),
  );
  clearGoogleOAuthCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(request);

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return redirectToAuth(
      request,
      oauthError === "access_denied" ? "denied" : "failed",
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    return redirectToAuth(request, "failed");
  }

  if (!clientId || !clientSecret) {
    return redirectToAuth(request, "unavailable");
  }

  let idToken: string | undefined;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
      cache: "no-store",
    });

    const payload = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || typeof payload.id_token !== "string") {
      return redirectToAuth(request, "failed");
    }

    idToken = payload.id_token;
  } catch {
    return redirectToAuth(request, "failed");
  }

  try {
    const locale = await getLocale();
    const tokens = await loginWithGoogleIdToken(idToken, locale);
    const response = NextResponse.redirect(new URL("/", request.url));
    setAuthCookies(response, tokens);
    clearGoogleOAuthCookies(response);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return redirectToAuth(request, "failed");
  }
}
