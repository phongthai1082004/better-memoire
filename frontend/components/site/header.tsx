import { getHeaderUser } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n/server";
import { HeaderClient } from "@/components/site/header-client";

export async function SiteHeader() {
  const user = await getHeaderUser();
  const { locale, t } = await getMessages();

  return (
    <HeaderClient
      user={user}
      locale={locale}
      copy={t.nav}
      notificationsCopy={t.notifications}
    />
  );
}
