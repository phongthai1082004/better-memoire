export type ClientResult<T> =
  | { ok: true; data: T; message: string; status: number }
  | {
      ok: false;
      message: string;
      status: number;
      fieldErrors?: Record<string, string[]>;
    };

export async function postJson<T>(
  url: string,
  body: unknown,
  offlineMessage = "The studio is offline right now. Please try again in a moment.",
): Promise<ClientResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          message?: string;
          data?: T;
          errors?: Record<string, string[]>;
        }
      | null;

    if (response.ok) {
      return {
        ok: true,
        data: payload?.data as T,
        message: payload?.message ?? "OK",
        status: response.status,
      };
    }

    return {
      ok: false,
      message:
        payload?.message ??
        (response.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : "Something went wrong. Please try again."),
      status: response.status,
      fieldErrors: payload?.errors ?? undefined,
    };
  } catch {
    return {
      ok: false,
      message: offlineMessage,
      status: 0,
    };
  }
}

/** Server field keys can arrive capitalised; match them case-insensitively. */
export function pickFieldErrors(
  errors: Record<string, string[]> | undefined,
  field: string,
) {
  if (!errors) return undefined;
  const key = Object.keys(errors).find(
    (candidate) => candidate.toLowerCase() === field.toLowerCase(),
  );
  return key ? errors[key]?.[0] : undefined;
}
