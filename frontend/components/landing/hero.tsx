import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Polaroid } from "@/components/ui/polaroid";
import { buttonStyles } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Hero({
  copy,
  images,
}: {
  copy: Dictionary["hero"];
  images: Dictionary["images"];
}) {
  return (
    <section className="overflow-hidden">
      <div className="page-shell grid items-center gap-16 pb-16 pt-12 md:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:pb-32 lg:pt-20">
        <Reveal immediate className="relative z-10 max-w-[640px]">
          <h1 className="h-hero">
            {copy.title}
            <span className="em">{copy.accent}</span>
          </h1>
          <p className="mt-7 max-w-[46ch] text-[1.06rem] leading-[1.7] text-body md:text-[1.16rem]">
            {copy.subtitle}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/auth?mode=register"
              className={buttonStyles({ size: "lg", className: "group" })}
            >
              {copy.primary}
              <ArrowRight
                size={16}
                weight="bold"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="#books"
              className="link-hand group inline-flex items-center gap-2"
            >
              {copy.secondary}
              <ArrowDown
                size={15}
                weight="bold"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </Link>
          </div>
        </Reveal>

        <Reveal immediate delay={0.14} className="relative">
          <div className="relative mx-auto w-full max-w-[500px] lg:mr-0">
            <Polaroid
              src="/images/hero-polaroids.webp"
              alt={images.heroPolaroids}
              aspect="tall"
              tilt={2.2}
              priority
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 62vw, 88vw"
              captionClassName="text-right"
            >
              <span className="hand text-[1.02rem] text-body">
                {copy.caption}
              </span>
            </Polaroid>

            <div className="absolute -bottom-16 -left-4 z-20 hidden w-[44%] max-w-[220px] sm:block lg:-left-14">
              <Polaroid
                src="/images/hero-portrait.webp"
                alt={images.heroPortrait}
                aspect="portrait"
                tilt={-4.5}
                sizes="(min-width: 1024px) 20vw, 30vw"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
