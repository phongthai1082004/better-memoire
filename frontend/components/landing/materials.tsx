import { Reveal } from "@/components/motion/reveal";
import { Polaroid } from "@/components/ui/polaroid";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Materials({
  copy,
  images,
}: {
  copy: Dictionary["materials"];
  images: Dictionary["images"];
}) {
  const specs = [
    { number: "1", title: copy.bindingTitle, body: copy.bindingBody },
    { number: "2", title: copy.pagesTitle, body: copy.pagesBody },
  ];

  return (
    <section id="materials" className="scroll-mt-28 py-[var(--section-y)]">
      <div className="page-shell">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="h-section h-section--marked max-w-[14ch]">
              {copy.title}
            </h2>
            <p className="mt-6 max-w-[38ch] text-body">{copy.intro}</p>
          </Reveal>

          <div className="grid gap-9 sm:grid-cols-2">
            <Reveal className="sm:col-span-2">
              <Polaroid
                src="/images/craft-camera.webp"
                alt={images.craftCamera}
                aspect="landscape"
                tilt={-1.2}
                sizes="(min-width: 1024px) 58vw, 92vw"
              />
            </Reveal>

            {specs.map((spec, index) => (
              <Reveal key={spec.title} delay={0.05 + index * 0.05}>
                <div className="panel flex h-full flex-col p-6 md:p-7">
                  <div className="flex items-center gap-4">
                    <span className="chalk-circle h-11 w-11 text-[1.1rem]">
                      {spec.number}
                    </span>
                    <h3 className="hand text-[1.5rem] leading-tight text-chalk md:min-h-[3.4rem]">
                      {spec.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-body">
                    {spec.body}
                  </p>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.15} className="sm:col-span-2">
              <Polaroid
                src="/images/paper-stack.webp"
                alt={images.paperStack}
                aspect="wide"
                tilt={1.3}
                sizes="(min-width: 1024px) 58vw, 92vw"
              >
                <span className="hand text-[1.02rem] text-body">
                  {copy.coverCaption}
                </span>
              </Polaroid>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
