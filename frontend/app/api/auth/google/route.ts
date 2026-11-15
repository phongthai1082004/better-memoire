import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithGoogleIdToken } from "@/lib/api/auth";
import { setAuthCookies } from "@/lib/auth/cookies";
import {
  assertSameOrigin,
  errorResponse,
  jsonError,
  readJson,
} from "@/lib/auth/http";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

const googleSchema = z.object({
  credential: z.string().min(20),
});

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const locale = await getLocale();
  const t = getDictionary(locale);

  const parsed = googleSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(t.auth.errors.generic, 400);
  }

  try {
    const tokens = await loginWithGoogleIdToken(parsed.data.credential, locale);
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
