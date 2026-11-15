import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Process({ copy }: { copy: Dictionary["process"] }) {
  return (
    <section id="process" className="scroll-mt-28 py-[var(--section-y)]">
      <div className="page-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="h-section h-section--marked max-w-[16ch]">
            {copy.title}
          </h2>
          <p className="mt-6 max-w-[36ch] text-body">{copy.intro}</p>
        </Reveal>

        <ol className="border-t border-dashed border-line">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="border-b border-dashed border-line">
              <Reveal
                delay={index * 0.06}
                className="grid grid-cols-[auto_1fr] gap-5 py-8 md:gap-8 md:py-10"
              >
                <span className="chalk-circle mt-1 h-14 w-14 text-[1.45rem]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="hand text-[1.7rem] leading-tight text-chalk">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[50ch] text-[0.98rem] leading-relaxed text-body">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
