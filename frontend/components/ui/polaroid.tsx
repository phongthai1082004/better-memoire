import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const aspects = {
  portrait: "aspect-[3/4]",
  tall: "aspect-[4/5]",
  landscape: "aspect-[16/11]",
  wide: "aspect-[3/2]",
  square: "aspect-square",
} as const;

export type PolaroidAspect = keyof typeof aspects;

/**
 * A physical print: cream matte, two strips of tape, a slight tilt, and an
 * optional hand-written caption. The tilt is set through the `--tilt` custom
 * property so the hover reset in `.photo-link` can still take over.
 */
export function Polaroid({
  src,
  alt,
  aspect = "portrait",
  tilt = 1.6,
  sizes,
  priority = false,
  loading,
  className,
  children,
  captionClassName,
}: {
  src: string;
  alt: string;
  aspect?: PolaroidAspect;
  tilt?: number;
  sizes: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  className?: string;
  children?: ReactNode;
  captionClassName?: string;
}) {
  return (
    <figure
      className={cn("polaroid", className)}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <div className="polaroid__frame">
        <div
          className={cn(
            "relative overflow-hidden bg-board-deep",
            aspects[aspect],
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            loading={loading}
            sizes={sizes}
            className="polaroid__img object-cover"
          />
        </div>
      </div>
      {children ? (
        <figcaption className={cn("polaroid__caption", captionClassName)}>
          {children}
        </figcaption>
      ) : null}
    </figure>
  );
}
