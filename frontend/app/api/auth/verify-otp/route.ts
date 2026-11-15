import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/api/auth";
import { setAuthCookies } from "@/lib/auth/cookies";
import {
  assertSameOrigin,
  errorResponse,
  jsonError,
  readJson,
  zodFieldErrors,
} from "@/lib/auth/http";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const locale = await getLocale();
  const t = getDictionary(locale);
  const schema = z.object({
    email: z.string().trim().email(t.auth.validation.emailInvalid),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t.auth.validation.otpInvalid),
    password: z.string().optional(),
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
  });
  const parsed = schema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(
      t.auth.errors.invalidForm,
      400,
      zodFieldErrors(parsed.error),
    );
  }

  try {
    const tokens = await verifyOtp(parsed.data, locale);
    const response = NextResponse.json({
      success: true,
      message: t.auth.buttons.verify,
      data: null,
    });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
