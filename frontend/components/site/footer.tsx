import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { getMessages } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";

export async function SiteFooter() {
  const { t } = await getMessages();

  const columns = [
    {
      title: t.footer.shopTitle,
      links: [
        { href: "/#books", label: t.footer.shopLinks.books },
        { href: "/#materials", label: t.footer.shopLinks.materials },
        { href: "/#process", label: t.footer.shopLinks.process },
      ],
    },
    {
      title: t.footer.accountTitle,
      links: [
        { href: "/auth", label: t.footer.accountLinks.signIn },
        { href: "/auth?mode=register", label: t.footer.accountLinks.register },
      ],
    },
  ];

  return (
    <footer className="border-t border-dashed border-line bg-board-deep">
      <div className="page-shell grid gap-12 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-20">
        <div className="max-w-md">
          <Brand />
          <p className="mt-6 text-[0.98rem] leading-relaxed text-body">
            {t.footer.tagline}
          </p>
          <a
            href={`mailto:${t.footer.email}`}
            className="link-hand mt-5 inline-block text-yellow"
          >
            {t.footer.email}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="font-display text-[0.95rem] font-medium uppercase tracking-[0.2em] text-chalk">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line-soft">
        <div className="page-shell flex flex-col gap-2 py-6 text-[0.76rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{fill(t.footer.copyright, { year: new Date().getFullYear() })}</p>
          <p>{t.footer.photography}</p>
        </div>
      </div>
    </footer>
  );
}
