"use client";

import { List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { UserMenu } from "@/components/site/user-menu";
import { Brand } from "@/components/ui/brand";
import { buttonStyles } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { HeaderUser } from "@/lib/auth/session";

export function HeaderClient({
  user,
  locale,
  copy,
  notificationsCopy,
}: {
  user: HeaderUser | null;
  locale: Locale;
  copy: Dictionary["nav"];
  notificationsCopy: Dictionary["notifications"];
}) {
  const isAuthenticated = Boolean(user);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const isLanding = pathname === "/";

  const landingLinks = [
    { href: "/#books", label: copy.books },
    { href: "/#materials", label: copy.materials },
    { href: "/#process", label: copy.process },
  ];

  const links = user
    ? [
        { href: "/", label: copy.home },
        { href: "/account", label: copy.account },
      ]
    : isLanding
      ? landingLinks
      : [];

  useEffect(() => {
    if (!open) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-board-deep/90 backdrop-blur-md">
      <div className="flex h-[78px] w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Brand />

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher locale={locale} label={copy.language} />
          {isAuthenticated && (
            <NotificationsBell copy={notificationsCopy} locale={locale} />
          )}
          {isAuthenticated && user ? (
            <UserMenu user={user} copy={copy} />
          ) : (
            <Link
              href="/auth"
              className="nav-link hidden text-[0.95rem] sm:inline-flex"
            >
              {copy.signIn}
            </Link>
          )}
          <Link
            href="/auth?mode=register"
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "hidden h-10 md:inline-flex",
            })}
          >
            {copy.start}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? copy.closeMenu : copy.openMenu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid h-10 w-10 place-items-center border border-dashed border-line text-chalk transition-colors hover:border-yellow hover:text-yellow lg:hidden"
            style={{ borderRadius: "50% 46% 52% 48% / 48% 52% 46% 54%" }}
          >
            {open ? <X size={19} /> : <List size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[78px] z-50 border-b border-line bg-board-deep px-5 pb-9 pt-3 lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="hand border-b border-dashed border-line-soft py-4 text-[1.75rem] leading-none text-chalk"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <div className="flex items-center justify-between gap-4 border-b border-dashed border-line-soft py-4">
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="truncate text-sm text-muted"
                  >
                    {copy.account}
                  </Link>
                  <SignOutButton label={copy.signOut} />
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setOpen(false)}
                  className="hand border-b border-dashed border-line-soft py-4 text-[1.75rem] leading-none text-chalk"
                >
                  {copy.signIn}
                </Link>
              )}
            </nav>
            <Link
              href="/auth?mode=register"
              onClick={() => setOpen(false)}
              className={buttonStyles({
                size: "lg",
                className: "mt-7 w-full",
              })}
            >
              {copy.start}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
