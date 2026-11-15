import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  getGoogleOAuthConfig,
  googleOAuthCookieOptions,
} from "@/lib/auth/google-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(request);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/auth?google=unavailable", request.url),
    );
  }

  const state = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth",
  );
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");
  authorizationUrl.searchParams.set("access_type", "online");
  authorizationUrl.searchParams.set("include_granted_scopes", "true");

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = googleOAuthCookieOptions();
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(
    GOOGLE_VERIFIER_COOKIE,
    codeVerifier,
    cookieOptions,
  );
  response.headers.set("Cache-Control", "no-store");

  return response;
}
