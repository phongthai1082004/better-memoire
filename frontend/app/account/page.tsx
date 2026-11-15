import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountClient } from "@/components/account/account-client";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getSession } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return {
    title: t.account.eyebrow,
    description: t.account.intro,
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { locale, t } = await getMessages();

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-[70dvh]">
        <AccountClient copy={t.account} locale={locale} />
      </main>
      <SiteFooter />
    </>
  );
}
