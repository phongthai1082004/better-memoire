"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ACCESS_EXP_COOKIE,
  SIGNED_IN_COOKIE,
} from "@/lib/auth/cookie-names";

function readCookie(name: string) {
  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

/**
 * Rotates the refresh token before the 15 minute access cookie expires.
 * The backend revokes all sessions when a rotated refresh token is replayed,
 * so this runs from a single scheduler per page.
 */
export function SessionRefresher() {
  const router = useRouter();

  useEffect(() => {
    if (readCookie(SIGNED_IN_COOKIE) !== "1") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function refresh() {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    async function refreshOnce() {
      // Cross-tab serialisation: the backend revokes all sessions when a rotated
      // refresh token is replayed, so two tabs must not rotate at the same time.
      if ("locks" in navigator) {
        return navigator.locks.request("bm-session-refresh", async () => {
          const raw = readCookie(ACCESS_EXP_COOKIE);
          const expiresAt = raw ? Number(raw) : 0;
          if (expiresAt > Date.now() + 60_000) return true;
          return refresh();
        });
      }

      return refresh();
    }

    function schedule(failures = 0) {
      if (cancelled) return;

      const raw = readCookie(ACCESS_EXP_COOKIE);
      const expiresAt = raw ? Number(raw) : 0;
      const untilExpiry = Number.isFinite(expiresAt) && expiresAt > 0
        ? expiresAt - Date.now() - 60_000
        : 60_000;
      const wait = Math.max(0, untilExpiry) + failures * 60_000;

      timer = setTimeout(async () => {
        const ok = await refreshOnce();
        if (cancelled) return;

        if (ok) {
          router.refresh();
          schedule(0);
        } else {
          schedule(failures + 1);
        }
      }, wait);
    }

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return null;
}
