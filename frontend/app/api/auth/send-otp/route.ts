import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/api/auth";
import {
  assertSameOrigin,
  errorResponse,
  jsonError,
  readJson,
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
  });
  const parsed = schema.safeParse(await readJson(request));

  if (!parsed.success) {
    return jsonError(t.auth.errors.invalidForm, 400);
  }

  try {
    await sendOtp(parsed.data.email, locale);
    return NextResponse.json({
      success: true,
      message: t.auth.otpNotice.replace("{email}", parsed.data.email),
      data: null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
