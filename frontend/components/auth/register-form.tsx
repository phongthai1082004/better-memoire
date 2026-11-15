"use client";

import { CheckCircle, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pickFieldErrors, postJson } from "@/lib/api/browser";
import type { RegisteredUser } from "@/lib/api/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  createRegisterSchema,
  passwordChecks,
  type RegisterInput,
} from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

export function RegisterForm({
  copy,
  onOtpSent,
}: {
  copy: Dictionary["auth"];
  onOtpSent: (email: string) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const schema = useMemo(
    () => createRegisterSchema(copy.validation),
    [copy.validation],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordField = register("password");
  const checks = passwordChecks(passwordValue, copy.passwordChecks);

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const result = await postJson<RegisteredUser>(
      "/api/auth/register",
      values,
      copy.errors.offline,
    );

    if (result.ok) {
      onOtpSent(result.data?.email ?? values.email);
      return;
    }

    setFormError(result.message || copy.errors.generic);
    for (const field of [
      "fullName",
      "email",
      "phoneNumber",
      "password",
      "confirmPassword",
    ] as const) {
      const message = pickFieldErrors(result.fieldErrors, field);
      if (message) setError(field, { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <div role="alert" className="alert-error">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
          <p>{formError}</p>
        </div>
      )}

      <FormField
        id="register-name"
        label={copy.fields.fullName}
        error={errors.fullName?.message}
      >
        <Input
          id="register-name"
          autoComplete="name"
          placeholder={copy.placeholders.fullName}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "register-name-error" : undefined}
          {...register("fullName")}
        />
      </FormField>

      <FormField
        id="register-phone"
        label={copy.fields.phone}
        error={errors.phoneNumber?.message}
      >
        <Input
          id="register-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={copy.placeholders.phone}
          aria-invalid={Boolean(errors.phoneNumber)}
          aria-describedby={
            errors.phoneNumber ? "register-phone-error" : undefined
          }
          {...register("phoneNumber")}
        />
      </FormField>

      <FormField
        id="register-email"
        label={copy.fields.email}
        error={errors.email?.message}
      >
        <Input
          id="register-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={copy.placeholders.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <FormField
        id="register-password"
        label={copy.fields.password}
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={copy.placeholders.password}
            className="pr-10"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
            {...passwordField}
            onChange={(event) => {
              passwordField.onChange(event);
              setPasswordValue(event.target.value);
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            className="absolute bottom-1 right-0 grid h-8 w-8 place-items-center text-muted transition-colors hover:text-chalk"
          >
            {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </FormField>

      <FormField
        id="register-confirm"
        label={copy.fields.confirmPassword}
        error={errors.confirmPassword?.message}
      >
        <Input
          id="register-confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={copy.placeholders.confirmPassword}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? "register-confirm-error" : undefined
          }
          {...register("confirmPassword")}
        />
      </FormField>

      {passwordValue.length > 0 && (
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1.5"
          aria-label={copy.passwordChecks.title}
        >
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-center gap-1.5 text-[0.7rem] tracking-[0.02em]",
                check.met ? "text-yellow" : "text-muted",
              )}
            >
              <CheckCircle
                size={11}
                weight={check.met ? "fill" : "regular"}
                aria-hidden="true"
              />
              {check.label}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? copy.buttons.registering : copy.buttons.register}
      </Button>

      <p className="text-center text-[0.72rem] leading-relaxed text-muted">
        {copy.terms}
      </p>
    </form>
  );
}
