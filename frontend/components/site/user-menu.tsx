/* eslint-disable @next/next/no-img-element */
"use client";

import { SignOut, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { HeaderUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function UserMenu({
  user,
  copy,
}: {
  user: HeaderUser;
  copy: Dictionary["nav"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const initial = (user.name || user.email).charAt(0).toUpperCase();

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function show() {
    clearCloseTimer();
    setOpen(true);
  }

  function hideSoon() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setPending(false);
      setOpen(false);
      router.refresh();
      router.push("/");
    }
  }

  return (
    <div
      className="relative flex h-12 items-center"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={copy.account}
        className="btn btn-outline btn-sm h-12 !border-line !text-chalk gap-2 py-1 pl-1.5 pr-3 hover:!border-line hover:!bg-white/5 hover:!text-chalk"
      >
        <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-yellow text-[0.78rem] font-semibold text-yellow-ink">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <span className="hidden max-w-[9.5rem] truncate text-[1.05rem] sm:block">
          {user.name}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={copy.account}
          className="panel panel-outline absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden"
          onMouseEnter={show}
          onMouseLeave={hideSoon}
        >
          <div className="border-b border-dashed border-line px-4 py-3">
            <p className="truncate text-[0.82rem] font-medium text-chalk">
              {user.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-[0.62rem] uppercase tracking-[0.08em] text-muted">
              {user.email}
            </p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-b border-dashed border-line px-4 py-3 text-[0.86rem] text-body transition-colors hover:bg-board-deep hover:text-yellow"
          >
            <UserCircle size={16} />
            {copy.account}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            disabled={pending}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[0.86rem] text-body transition-colors hover:bg-board-deep hover:text-yellow disabled:opacity-55"
          >
            <SignOut size={16} />
            {pending ? "..." : copy.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
