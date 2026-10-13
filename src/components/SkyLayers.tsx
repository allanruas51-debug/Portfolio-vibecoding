"use client";

import { forwardRef } from "react";

const PORTRAIT = "(orientation: portrait)";
const SIZES = "(orientation: portrait) 130vw, 110vw";

/** Céu limpo com arte direcionada por orientação (AVIF → WebP). */
export function SkyPicture({ priority = false, className = "" }: { priority?: boolean; className?: string }) {
  return (
    <picture className={className}>
      <source
        media={PORTRAIT}
        type="image/avif"
        sizes={SIZES}
        srcSet="/media/sky-mobile-640.avif 640w, /media/sky-mobile-940.avif 940w"
      />
      <source
        media={PORTRAIT}
        type="image/webp"
        sizes={SIZES}
        srcSet="/media/sky-mobile-640.webp 640w, /media/sky-mobile-940.webp 940w"
      />
      <source
        type="image/avif"
        sizes={SIZES}
        srcSet="/media/sky-desktop-960.avif 960w, /media/sky-desktop-1536.avif 1536w"
      />
      <img
        src="/media/sky-desktop-1536.webp"
        srcSet="/media/sky-desktop-960.webp 960w, /media/sky-desktop-1536.webp 1536w"
        sizes={SIZES}
        alt=""
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
      />
    </picture>
  );
}

/** Camadas 1 e 2: céu (zoom/drift lento) e faixa do horizonte com raios de sol. */
export const SkyBack = forwardRef<HTMLDivElement, { skyRef?: React.Ref<HTMLDivElement> }>(function SkyBack(
  { skyRef },
  horizonRef,
) {
  return (
    <>
      <div ref={skyRef} className="layer" data-depth="0.15" data-layer="sky">
        <div className="stage sky-drift">
          <SkyPicture priority />
        </div>
      </div>
      <div ref={horizonRef} className="layer" data-depth="0.35" data-layer="horizon">
        <div className="stage">
          <SkyPicture className="mask-horizon" />
          <div className="sun-rays" />
        </div>
      </div>
    </>
  );
});

/** Camada 5: nuvens de primeiro plano, recortadas do próprio céu. */
export const SkyFront = forwardRef<HTMLDivElement>(function SkyFront(_, ref) {
  return (
    <div ref={ref} className="layer" data-depth="1.25" data-layer="front">
      <div className="stage">
        <SkyPicture className="fg-clouds" />
      </div>
    </div>
  );
});
