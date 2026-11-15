import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ValidationCopy = Dictionary["auth"]["validation"];

/**
 * Mirrors the FluentValidation rules:
 * - login password >= 6
 * - register password >= 8, upper, lower, digit, symbol
 * - phone: ^(0[3|5|7|8|9])+([0-9]{8})$
 */
const phonePattern = /^(0[35789])+([0-9]{8})$/;

export function createLoginSchema(copy: ValidationCopy) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, copy.emailRequired)
      .email(copy.emailInvalid),
    password: z
      .string()
      .min(1, copy.passwordRequired)
      .min(6, copy.passwordMinLogin),
  });
}

export function createRegisterSchema(copy: ValidationCopy) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(1, copy.fullNameRequired)
        .max(100, copy.fullNameMax),
      email: z
        .string()
        .trim()
        .min(1, copy.emailRequired)
        .email(copy.emailInvalid),
      phoneNumber: z
        .string()
        .trim()
        .regex(phonePattern, copy.phoneInvalid)
        .or(z.literal("")),
      password: z
        .string()
        .min(8, copy.passwordMin)
        .regex(/[A-Z]/, copy.passwordUpper)
        .regex(/[a-z]/, copy.passwordLower)
        .regex(/[0-9]/, copy.passwordNumber)
        .regex(/[\W_]/, copy.passwordSymbol),
      confirmPassword: z.string().min(1, copy.confirmRequired),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: copy.passwordMismatch,
    });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;

export function passwordChecks(
  password: string,
  labels: Dictionary["auth"]["passwordChecks"],
) {
  return [
    { label: labels.length, met: password.length >= 8 },
    { label: labels.upper, met: /[A-Z]/.test(password) },
    { label: labels.lower, met: /[a-z]/.test(password) },
    { label: labels.number, met: /[0-9]/.test(password) },
    { label: labels.symbol, met: /[\W_]/.test(password) },
  ];
}
