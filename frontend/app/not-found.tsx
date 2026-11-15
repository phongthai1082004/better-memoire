import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { buttonStyles } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getMessages();

  return (
    <main
      id="main"
      className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-16 text-center"
    >
      <Brand />
      <p className="eyebrow mt-16">{t.notFound.label}</p>
      <h1 className="hand mt-5 max-w-[18ch] text-[clamp(2.4rem,5vw,3.9rem)] leading-[1.1] text-chalk">
        {t.notFound.title}
      </h1>
      <svg
        aria-hidden="true"
        viewBox="0 0 120 12"
        className="mt-6 h-3 w-28 text-coral/75"
      >
        <path
          d="M2 8Q22 1 42 7T82 6T118 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-5 max-w-[42ch] text-body">{t.notFound.body}</p>
      <Link
        href="/"
        className={buttonStyles({ size: "lg", className: "group mt-9" })}
      >
        {t.notFound.cta}
        <ArrowRight
          size={16}
          weight="bold"
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </Link>
    </main>
  );
}
