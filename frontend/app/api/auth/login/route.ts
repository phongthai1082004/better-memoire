import { NextResponse } from "next/server";
import { loginWithPassword } from "@/lib/api/auth";
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
import { createLoginSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const locale = await getLocale();
  const t = getDictionary(locale);
  const parsed = createLoginSchema(t.auth.validation).safeParse(
    await readJson(request),
  );

  if (!parsed.success) {
    return jsonError(
      t.auth.errors.invalidForm,
      400,
      zodFieldErrors(parsed.error),
    );
  }

  try {
    const tokens = await loginWithPassword(parsed.data, locale);
    const response = NextResponse.json({
      success: true,
      message: t.auth.buttons.login,
      data: null,
    });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
