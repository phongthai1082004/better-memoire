import { Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pickFieldErrors, postJson } from "@/lib/api/browser";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createLoginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm({
  defaultEmail = "",
  copy,
}: {
  defaultEmail?: string;
  copy: Dictionary["auth"];
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(
    () => createLoginSchema(copy.validation),
    [copy.validation],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail, password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await postJson<null>(
      "/api/auth/login",
      values,
      copy.errors.offline,
    );

    if (result.ok) {
      router.refresh();
      router.push("/");
      return;
    }

    setFormError(result.message || copy.errors.generic);
    for (const field of ["email", "password"] as const) {
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
        id="login-email"
        label={copy.fields.email}
        error={errors.email?.message}
      >
        <Input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={copy.placeholders.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <FormField
        id="login-password"
        label={copy.fields.password}
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={copy.placeholders.password}
            className="pr-10"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
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

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? copy.buttons.loggingIn : copy.buttons.login}
      </Button>
    </form>
  );
}
