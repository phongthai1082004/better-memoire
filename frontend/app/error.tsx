"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Button, buttonStyles } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-16 text-center"
    >
      <Brand />
      <h1 className="hand mt-16 max-w-[20ch] text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.12] text-chalk">
        Something interrupted the page.
      </h1>
      <p className="mt-5 max-w-[42ch] text-body">
        Nothing you uploaded was lost. Try the page again, or return to the
        studio.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" onClick={reset}>
          <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
          Try again
        </Button>
        <Link
          href="/"
          className={buttonStyles({ variant: "secondary", size: "lg" })}
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
