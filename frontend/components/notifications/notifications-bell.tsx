"use client";

import { Bell } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, type NotificationItem, type NotificationList } from "@/lib/api/app";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

function notificationText(
  item: NotificationItem,
  field: "title" | "message",
  locale: Locale,
): string {
  try {
    const parsed = item.i18n ? JSON.parse(item.i18n) : null;
    const localized = parsed?.[field]?.[locale];
    if (typeof localized === "string" && localized.trim()) return localized;
  } catch {
    // Fall back to the stored default copy.
  }
  return item[field] ?? "";
}

export function NotificationsBell({
  copy,
  locale,
}: {
  copy: Dictionary["notifications"];
  locale: Locale;
}) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<NotificationList>(
        "/api/v1/notifications?limit=20",
      );
      setItems(data.items);
      setUnread(data.unreadCount);
      setError(null);
    } catch {
      setError(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed]);

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function setRead(item: NotificationItem, read: boolean) {
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, isRead: read } : entry,
      ),
    );
    setUnread((current) => Math.max(0, current + (read ? -1 : 1)));

    try {
      await apiRequest(`/api/v1/notifications/${item.id}/${read ? "read" : "unread"}`, {
        method: "PATCH",
      });
    } catch {
      void load();
    }
  }

  async function openItem(item: NotificationItem) {
    if (!item.isRead) await setRead(item, true);
    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  }

  async function markAllRead() {
    const unreadItems = items.filter((item) => !item.isRead);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
    await Promise.all(
      unreadItems.map((item) =>
        apiRequest(`/api/v1/notifications/${item.id}/read`, { method: "PATCH" }).catch(
          () => null,
        ),
      ),
    );
  }

  return (
    <div ref={container} className="relative flex h-12 items-center">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        aria-label={copy.open}
        aria-expanded={open}
        className="btn btn-outline btn-sm relative h-12 w-12 !border-line !p-0 !text-chalk hover:!border-line hover:!bg-white/5 hover:!text-chalk"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 font-mono text-[9px] font-bold leading-none text-board-deep">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 w-[min(22rem,calc(100vw-2rem))] pt-2">
          <div className="panel panel-outline overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-dashed border-line px-4 py-3">
              <p className="font-display text-[0.78rem] uppercase tracking-[0.16em] text-chalk">
                {copy.title}
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted hover:text-yellow"
                >
                  {copy.markAllRead}
                </button>
              )}
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-muted">…</p>
              ) : error ? (
                <p className="px-4 py-8 text-center text-sm text-coral">{error}</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">{copy.empty}</p>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    className={`border-b border-dashed border-line-soft px-4 py-3 last:border-b-0 ${
                      item.isRead ? "opacity-65" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void openItem(item)}
                      className="block w-full text-left"
                    >
                      <p className="flex items-start gap-2 text-sm font-semibold leading-snug text-chalk">
                        {!item.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow" />
                        )}
                        {notificationText(item, "title", locale)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed text-muted">
                        {notificationText(item, "message", locale).replace(/<[^>]*>/g, "")}
                      </p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                        {new Date(item.createdOnUtc).toLocaleString(locale)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void setRead(item, !item.isRead)}
                      className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-yellow"
                    >
                      {item.isRead ? copy.markUnread : copy.markRead}
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
