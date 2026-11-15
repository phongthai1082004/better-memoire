import { backendFetch } from "@/lib/api/client";
import type { AuthTokens, RegisteredUser } from "@/lib/api/types";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

/**
 * Actual backend routes (Presentation/Controllers/UserController.cs):
 *   POST /api/v1/user/login
 *   POST /api/v1/user/register
 *   POST /api/v1/user/send-otp
 *   POST /api/v1/user/verify-otp
 *   POST /api/v1/user/google
 *   POST /api/v1/user/refresh
 *   POST /api/v1/user/logout
 */
export function loginWithPassword(input: LoginInput, locale: string) {
  return backendFetch<AuthTokens>("/api/v1/user/login", {
    method: "POST",
    headers: { "accept-language": locale },
    body: JSON.stringify(input),
  });
}

export function registerAccount(input: RegisterInput, locale: string) {
  return backendFetch<RegisteredUser>("/api/v1/user/register", {
    method: "POST",
    headers: { "accept-language": locale },
    body: JSON.stringify({
      email: input.email,
      fullName: input.fullName,
      password: input.password,
      phoneNumber: input.phoneNumber?.length ? input.phoneNumber : null,
      avatarUrl: "",
    }),
  });
}

export function sendOtp(email: string, locale: string) {
  return backendFetch<{ message: string }>("/api/v1/user/send-otp", {
    method: "POST",
    headers: { "accept-language": locale },
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(
  input: { email: string; otp: string; password?: string; fullName?: string; phoneNumber?: string },
  locale: string,
) {
  return backendFetch<AuthTokens>("/api/v1/user/verify-otp", {
    method: "POST",
    headers: { "accept-language": locale },
    body: JSON.stringify(input),
  });
}

export function refreshSession(refreshToken: string, locale: string) {
  return backendFetch<AuthTokens>("/api/v1/user/refresh", {
    method: "POST",
    headers: { "accept-language": locale },
    body: JSON.stringify({ refreshToken }),
  });
}

export function logoutSession(accessToken: string, locale: string) {
  return backendFetch<{ message: string }>("/api/v1/user/logout", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "accept-language": locale,
    },
  });
}

/**
 * Google ID token exchange.
 */
export function loginWithGoogleIdToken(credential: string, locale: string) {
  const path = process.env.GOOGLE_BACKEND_PATH ?? "/api/v1/user/google";

  return backendFetch<AuthTokens>(path, {
    method: "POST",
    headers: { "accept-language": locale },
    body: JSON.stringify({ idToken: credential }),
  });
}
