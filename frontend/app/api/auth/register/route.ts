import { NextResponse } from "next/server";
import { registerAccount } from "@/lib/api/auth";
import {
  assertSameOrigin,
  errorResponse,
  jsonError,
  readJson,
  zodFieldErrors,
} from "@/lib/auth/http";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import { createRegisterSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const locale = await getLocale();
  const t = getDictionary(locale);
  const parsed = createRegisterSchema(t.auth.validation).safeParse(
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
    const user = await registerAccount(parsed.data, locale);
    return NextResponse.json(
      {
        success: true,
        message: t.auth.otpNotice.replace("{email}", parsed.data.email),
        data: user,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
