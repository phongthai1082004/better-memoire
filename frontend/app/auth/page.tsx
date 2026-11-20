import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthVisual } from "@/components/auth/auth-visual";
import { Brand } from "@/components/ui/brand";
import { getSession } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();

  return {
    title: `${t.auth.tabs.login} · ${t.auth.tabs.register}`,
    description: t.auth.loginSubtitle,
    robots: { index: false, follow: false },
  };
}

type AuthSearchParams = Promise<{
  mode?: string | string[];
  google?: string | string[];
}>;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: AuthSearchParams;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const params = await searchParams;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const google = Array.isArray(params.google) ? params.google[0] : params.google;
  const initialMode = mode === "register" ? "register" : "login";
  const { locale, t } = await getMessages();
  const googleError =
    google === "unavailable"
      ? t.auth.errors.googleUnavailable
      : google === "denied"
        ? t.auth.errors.googleDenied
        : google === "failed"
          ? t.auth.errors.googleFailed
          : null;

  return (
    <main id="main" className="grid min-h-[100dvh] lg:grid-cols-[0.95fr_1.05fr]">
      <AuthVisual copy={t.auth.visual} imageAlt={t.images.heroPolaroids} />

      <section className="flex min-h-[100dvh] flex-col px-5 pb-12 pt-5 sm:px-9 lg:px-14">
        <div className="mx-auto mt-10 flex w-full max-w-[560px] flex-1 flex-col ">
          <div className="flex h-12 items-center lg:hidden">
            <Brand />
          </div>

          <div className="mt-10 w-full lg:mt-0">
            <AuthPanel
              initialMode={initialMode}
              copy={t.auth}
              locale={locale}
              googleError={googleError}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
