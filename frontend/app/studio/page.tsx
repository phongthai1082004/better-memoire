import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioShell } from "@/features/studio/studio-shell";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Studio",
  description: "Lay out the pages of your photo book.",
  robots: { index: false, follow: false },
};

type StudioSearchParams = Promise<{
  bookId?: string | string[];
}>;

export default async function StudioPage({
  searchParams,
}: {
  searchParams: StudioSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/auth?next=/studio");

  const params = await searchParams;
  const bookId = Array.isArray(params.bookId)
    ? params.bookId[0]
    : params.bookId;

  return <StudioShell initialBookId={bookId} />;
}
