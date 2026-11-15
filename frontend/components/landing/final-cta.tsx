import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function FinalCta({ copy }: { copy: Dictionary["cta"] }) {
  return (
    <section className="py-16 md:py-24">
      <div className="page-shell">
        <Reveal>
          <div className="panel panel-outline panel-sheen grid gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-end md:px-12 md:py-16">
            <h2 className="h-section relative max-w-[14ch]">{copy.title}</h2>
            <div className="relative md:pb-1">
              <p className="max-w-[34ch] text-body">{copy.body}</p>
              <Link
                href="/auth?mode=register"
                className={buttonStyles({
                  size: "lg",
                  className: "group mt-7",
                })}
              >
                {copy.button}
                <ArrowRight
                  size={16}
                  weight="bold"
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
