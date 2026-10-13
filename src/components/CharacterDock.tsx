"use client";

import { useEffect, useRef } from "react";
import { character } from "@/config/character";
import { ensureGsap } from "@/lib/gsap";
import { prefersReducedMotion, usePortrait } from "@/lib/media";
import { CharacterScene } from "./CharacterScene";
import { useExperience } from "./ExperienceProvider";

/**
 * O boneco "continua vivo" fora da hero: reaparece no canto inferior
 * direito das outras seções, ainda clicável (abre o balão).
 */
export function CharacterDock() {
  const { index, speak } = useExperience();
  const portrait = usePortrait();
  const ref = useRef<HTMLDivElement>(null);
  const shown = index > 0;
  const media = portrait ? character.mobile : character.desktop;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    const reduced = prefersReducedMotion();
    if (shown) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: reduced ? 0 : 80, scale: reduced ? 1 : 0.8 },
        { autoAlpha: 1, y: 0, scale: 1, duration: reduced ? 0.3 : 1.1, delay: reduced ? 0.2 : 1.1, ease: "expo.out" },
      );
    } else {
      gsap.to(el, { autoAlpha: 0, y: reduced ? 0 : 60, duration: 0.4, ease: "power2.in" });
    }
  }, [shown]);

  return (
    <div
      ref={ref}
      className="dock"
      style={{ "--dock-ratio": media.box.w / media.box.h } as React.CSSProperties}
      aria-hidden={!shown}
      inert={!shown}
    >
      <CharacterScene fill playing={shown} onActivate={speak} />
    </div>
  );
}
