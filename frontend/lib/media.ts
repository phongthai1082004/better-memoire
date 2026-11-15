/** R2 image helper for read-only profile/media URLs. */
export function r2Thumb(url: string, width = 320): string {
  if (!url.startsWith("http")) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/echotrace/")) return url;
    return `${parsed.origin}/w_${width}${parsed.pathname}`;
  } catch {
    return url;
  }
}
