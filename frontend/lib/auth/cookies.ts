import type { NextResponse } from "next/server";
import type { AuthTokens } from "@/lib/api/types";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import {
  ACCESS_COOKIE,
  ACCESS_EXP_COOKIE,
  REFRESH_COOKIE,
  SIGNED_IN_COOKIE,
} from "@/lib/auth/cookie-names";

export {
  ACCESS_COOKIE,
  ACCESS_EXP_COOKIE,
  REFRESH_COOKIE,
  SIGNED_IN_COOKIE,
} from "@/lib/auth/cookie-names";

const FIFTEEN_MINUTES = 60 * 15;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function clientCookieOptions(maxAge: number) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const payload = decodeJwtPayload(tokens.accessToken);
  const expiresAt =
    typeof payload?.exp === "number"
      ? payload.exp * 1000
      : Date.now() + FIFTEEN_MINUTES * 1000;

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(FIFTEEN_MINUTES));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(THIRTY_DAYS));
  response.cookies.set(SIGNED_IN_COOKIE, "1", clientCookieOptions(THIRTY_DAYS));
  response.cookies.set(
    ACCESS_EXP_COOKIE,
    String(expiresAt),
    clientCookieOptions(THIRTY_DAYS),
  );
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
  response.cookies.set(SIGNED_IN_COOKIE, "", clientCookieOptions(0));
  response.cookies.set(ACCESS_EXP_COOKIE, "", clientCookieOptions(0));
}
