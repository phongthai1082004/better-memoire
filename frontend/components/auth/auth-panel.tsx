"use client";

import { LockSimple } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { LoginForm } from "@/components/auth/login-form";
import { OtpForm } from "@/components/auth/otp-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ChalkTab } from "@/components/ui/chalk-tab";
import { fill } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type AuthMode = "login" | "register";

export function AuthPanel({
  initialMode,
  copy,
  locale,
  googleError,
}: {
  initialMode: AuthMode;
  copy: Dictionary["auth"];
  locale: Locale;
  googleError?: string | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);

  const tabs: Array<{ mode: AuthMode; label: string }> = [
    { mode: "login", label: copy.tabs.login },
    { mode: "register", label: copy.tabs.register },
  ];

  function switchMode(next: AuthMode) {
    setMode(next);
    router.replace(`/auth?mode=${next}`, { scroll: false });
  }

  function selectMode(next: AuthMode) {
    setOtpEmail(null);
    switchMode(next);
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = mode === "login" ? "register" : "login";
    selectMode(next);
    document.getElementById(`auth-tab-${next}`)?.focus();
  }

  const title = otpEmail
    ? copy.otpTitle
    : mode === "login"
      ? copy.loginTitle
      : copy.registerTitle;

  const subtitle = otpEmail
    ? fill(copy.otpSubtitle, { email: otpEmail })
    : mode === "login"
      ? copy.loginSubtitle
      : copy.registerSubtitle;

  return (
    <div>
      <div
        role="tablist"
        aria-label={copy.tabsLabel}
        onKeyDown={onTabKeyDown}
        className="chalk-tabs"
      >
        {tabs.map((tab) => (
          <ChalkTab
            key={tab.mode}
            id={`auth-tab-${tab.mode}`}
            role="tab"
            aria-selected={mode === tab.mode}
            aria-controls={`auth-panel-${tab.mode}`}
            tabIndex={mode === tab.mode ? 0 : -1}
            active={mode === tab.mode}
            onClick={() => selectMode(tab.mode)}
            className="chalk-tab"
          >
            {tab.label}
          </ChalkTab>
        ))}
      </div>

      <div className="pt-5">
        <h1 className="hand text-[clamp(2rem,3vw,2.4rem)] leading-[1.06] text-chalk">
          {title}
        </h1>
        <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-body">
          {subtitle}
        </p>
      </div>

      {!otpEmail && mode === "login" && (
        <GoogleAuthButton
          key={locale}
          label={copy.google}
          error={googleError}
        />
      )}

      <div className="mt-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={otpEmail ? "otp" : mode}
            id={`auth-panel-${mode}`}
            role="tabpanel"
            aria-labelledby={`auth-tab-${mode}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {otpEmail ? (
              <OtpForm
                email={otpEmail}
                copy={copy}
                onBack={() => {
                  setOtpEmail(null);
                }}
              />
            ) : mode === "login" ? (
              <LoginForm copy={copy} />
            ) : (
              <RegisterForm copy={copy} onOtpSent={setOtpEmail} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-6 flex items-start gap-2 text-[0.72rem] leading-relaxed text-muted">
        <LockSimple size={13} weight="regular" className="mt-0.5 shrink-0" />
        <span>{copy.security}</span>
      </p>
    </div>
  );
}
