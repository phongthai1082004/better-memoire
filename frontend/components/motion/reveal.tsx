"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const hidden = (y: number) => ({ opacity: 0, y });
const visible = { opacity: 1, y: 0 };

export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const shouldAnimate = Boolean(reduce) || immediate;

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : hidden(y)}
      animate={shouldAnimate ? visible : undefined}
      whileInView={reduce || immediate ? undefined : visible}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: reduce ? 0 : 0.75,
        delay: reduce ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
