import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Better Memoire home"
      className={cn(
        "group inline-flex items-baseline gap-3 rounded-sm focus-visible:outline-none",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="hand grid h-9 w-9 shrink-0 -rotate-2 place-items-center border-[1.5px] border-dashed border-yellow/80 text-[1.05rem] leading-none text-yellow transition-transform duration-300 group-hover:rotate-1"
        style={{ borderRadius: "50% 46% 52% 48% / 48% 52% 46% 54%" }}
      >
        bm
      </span>
      {!compact && (
        <span className="shrink-0 whitespace-nowrap font-display text-[0.92rem] font-medium uppercase leading-none tracking-[0.14em] text-chalk min-[400px]:text-[1rem] min-[400px]:tracking-[0.18em] sm:text-[1.18rem] sm:tracking-[0.24em]">
          Better Memoire
        </span>
      )}
    </Link>
  );
}
