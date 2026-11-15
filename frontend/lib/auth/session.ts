import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { decodeJwtPayload, isExpired, readIdentity } from "@/lib/auth/jwt";
import type { Session } from "@/lib/api/types";
import { backendFetch } from "@/lib/api/client";
import type { MeProfile } from "@/lib/api/app";

/** Server Components and Route Handlers only. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || isExpired(payload)) return null;

  const identity = readIdentity(payload);
  if (!identity.id || !identity.email) return null;

  return { user: identity };
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export type HeaderUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

/**
 * Header-only profile lookup. This is a live backend read, never cached, and falls
 * back to the JWT identity if the profile endpoint is unavailable.
 */
export async function getHeaderUser(): Promise<HeaderUser | null> {
  const session = await getSession();
  if (!session) return null;

  const fallbackName = session.user.email.split("@")[0] || session.user.email;
  const token = await getAccessToken();

  if (token) {
    try {
      const profile = await backendFetch<MeProfile>("/api/v1/user/me", {
        headers: { authorization: `Bearer ${token}` },
      });

      return {
        id: session.user.id,
        email: profile.email ?? session.user.email,
        name: profile.fullName || fallbackName,
        avatarUrl: profile.avatarUrl || null,
      };
    } catch {
      // Keep the header usable while the profile service is temporarily unavailable.
    }
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: fallbackName,
    avatarUrl: null,
  };
}
