import { ArrowLeft, LockSimple } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AuthVisual({
  copy,
  imageAlt,
}: {
  copy: Dictionary["auth"]["visual"];
  imageAlt: string;
}) {
  return (
    <aside className="relative hidden overflow-hidden bg-board-deep lg:block">
      <Image
        src="/images/hero-polaroids.webp"
        alt={imageAlt}
        fill
        priority
        sizes="48vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-board-deep/50 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,35,40,0.8)_0%,rgba(31,35,40,0.28)_46%,rgba(31,35,40,0.94)_100%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-10 xl:p-14">
        <div className="flex items-center justify-between gap-6">
          <Link
            href="/"
            className="hand inline-flex items-center gap-2 text-[1.05rem] text-body transition-colors hover:text-yellow"
          >
            <ArrowLeft size={16} weight="regular" aria-hidden="true" />
            {copy.back}
          </Link>
          <Brand href="/" />
        </div>

        <div className="max-w-md">
          <p className="hand text-[clamp(1.85rem,2.9vw,2.55rem)] leading-[1.2] text-chalk">
            {copy.quote}
          </p>
          <p className="mt-6 max-w-[34ch] text-[0.95rem] leading-relaxed text-body">
            {copy.body}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[0.74rem] text-muted">
          <LockSimple size={14} weight="regular" aria-hidden="true" />
          <span>{copy.security}</span>
        </div>
      </div>
    </aside>
  );
}
