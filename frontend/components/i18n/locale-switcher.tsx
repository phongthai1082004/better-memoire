"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ locale: Locale; label: string }> = [
  { locale: "vi", label: "VI" },
  { locale: "en", label: "EN" },
];

function persistLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleSwitcher({
  locale,
  label,
  className,
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

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

  function switchLocale(next: Locale) {
    persistLocale(next);
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      className={cn("relative flex h-10 items-center", className)}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-1.5 border border-dashed border-line px-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-chalk transition-colors hover:border-line hover:bg-white/5"
        style={{ borderRadius: "3px 6px 4px 6px / 6px 4px 6px 3px" }}
      >
        {locale.toUpperCase()}
        <span aria-hidden="true" className="text-[0.58rem] text-muted">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="panel panel-outline absolute right-0 top-full z-50 mt-1 w-24 overflow-hidden"
          onMouseEnter={show}
          onMouseLeave={hideSoon}
        >
          {OPTIONS.map((option) => (
            <button
              key={option.locale}
              type="button"
              role="menuitemradio"
              aria-checked={option.locale === locale}
              onClick={() => switchLocale(option.locale)}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/[0.06] hover:text-yellow",
                option.locale === locale ? "text-yellow" : "text-body",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
