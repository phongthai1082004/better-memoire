export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "bm_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "vi" || value === "en";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "vi" ? "en" : "vi";
}
