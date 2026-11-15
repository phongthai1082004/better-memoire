"use client";

import { ArrowLeft, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pickFieldErrors, postJson } from "@/lib/api/browser";
import { fill } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function OtpForm({
  email,
  copy,
  onBack,
}: {
  email: string;
  copy: Dictionary["auth"];
  onBack: () => void;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    if (!/^\d{6}$/.test(otp)) {
      setFormError(copy.validation.otpInvalid);
      return;
    }

    setIsVerifying(true);
    const result = await postJson<null>(
      "/api/auth/verify-otp",
      { email, otp },
      copy.errors.offline,
    );
    setIsVerifying(false);

    if (result.ok) {
      router.refresh();
      router.push("/");
      return;
    }

    const fieldMessage = pickFieldErrors(result.fieldErrors, "otp");
    setFormError(fieldMessage || result.message || copy.errors.invalidOtp);
  }

  async function resend() {
    setFormError(null);
    setNotice(null);
    setIsResending(true);
    const result = await postJson<null>(
      "/api/auth/send-otp",
      { email },
      copy.errors.offline,
    );
    setIsResending(false);

    if (result.ok) {
      setSeconds(60);
      setNotice(fill(copy.otpNotice, { email }));
      return;
    }

    setFormError(result.message || copy.errors.generic);
  }

  return (
    <form onSubmit={onVerify} noValidate className="space-y-5">
      {formError && (
        <div role="alert" className="alert-error">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      {notice && (
        <div role="status" className="alert-note">
          <CheckCircle
            size={16}
            weight="fill"
            className="mt-0.5 shrink-0 text-yellow"
          />
          <p>{notice}</p>
        </div>
      )}

      <FormField id="auth-otp" label={copy.fields.otp}>
        <Input
          id="auth-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          placeholder={copy.placeholders.otp}
          value={otp}
          onChange={(event) =>
            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="font-chalk text-center text-[2rem] tracking-[0.45em]"
          aria-invalid={Boolean(formError)}
        />
      </FormField>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isVerifying}
        aria-busy={isVerifying}
      >
        {isVerifying ? copy.buttons.verifying : copy.buttons.verify}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="hand inline-flex items-center gap-1.5 text-[1.02rem] text-body transition-colors hover:text-chalk"
        >
          <ArrowLeft size={15} weight="regular" aria-hidden="true" />
          {copy.buttons.changeDetails}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={seconds > 0 || isResending}
          className="hand text-[1.02rem] text-yellow transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:text-muted disabled:opacity-100"
        >
          {isResending
            ? copy.buttons.resending
            : seconds > 0
              ? fill(copy.otpResendIn, { seconds })
              : copy.buttons.resend}
        </button>
      </div>
    </form>
  );
}
