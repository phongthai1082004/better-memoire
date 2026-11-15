import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Polaroid } from "@/components/ui/polaroid";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const tilts = [-2.2, 1.8, -1.4, 2.2];

export function Books({
  copy,
  images,
}: {
  copy: Dictionary["books"];
  images: Dictionary["images"];
}) {
  const visuals = [
    { image: "/images/wedding-hands.webp", alt: images.weddingHands },
    { image: "/images/first-year.webp", alt: images.firstYear },
    { image: "/images/mood-window.webp", alt: images.moodWindow },
    { image: "/images/library.webp", alt: images.library },
  ];

  return (
    <section
      id="books"
      className="scroll-mt-28 border-y border-line-soft bg-panel/55 py-[var(--section-y)]"
    >
      <div className="page-shell">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-14">
          <h2 className="h-section h-section--marked max-w-[16ch]">
            {copy.title}
          </h2>
          <p className="max-w-[42ch] text-body md:pb-2">{copy.intro}</p>
        </Reveal>

        <div
          className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-9 overflow-x-auto px-5 pb-4 pt-6"
          aria-label={copy.title}
        >
          {visuals.map((visual, index) => (
            <Reveal
              key={visual.image}
              delay={index * 0.05}
              className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-6.75rem)/4)]"
            >
              <Link
                href="/auth?mode=register"
                className="photo-link group rounded-sm focus-visible:outline-none"
              >
                <Polaroid
                  src={visual.image}
                  alt={visual.alt}
                  aspect="portrait"
                  tilt={tilts[index] ?? 1.6}
                  loading="eager"
                  sizes="(min-width: 1280px) 252px, (min-width: 1024px) 230px, (min-width: 640px) 46vw, 80vw"
                >
                  <span className="hand block text-[1.28rem] leading-tight text-chalk">
                    {copy.items[index]?.title}
                  </span>
                  <span className="mt-1.5 block text-[0.86rem] leading-relaxed text-muted">
                    {copy.items[index]?.note}
                  </span>
                </Polaroid>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
