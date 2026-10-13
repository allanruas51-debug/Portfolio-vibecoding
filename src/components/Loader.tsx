"use client";

import { useEffect, useRef, useState } from "react";
import { character } from "@/config/character";
import { ensureGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/media";
import { useExperience } from "./ExperienceProvider";

/** Tempo máximo do loader: depois disso a hero entra com o que tiver (poster). */
const MAX_MS = 1500;
const MIN_MS = 450;

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
    if (img.complete) resolve();
  });
}

/** Assets críticos da orientação atual (os mesmos que a hero pede primeiro). */
function criticalAssets() {
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  const avif = document.createElement("canvas").toDataURL("image/avif").startsWith("data:image/avif");
  const ext = avif ? "avif" : "webp";
  const wide = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  const sky = portrait
    ? `/media/sky-mobile-${wide > 700 ? 940 : 640}.${ext}`
    : `/media/sky-desktop-${wide > 1100 ? 1536 : 960}.${ext}`;
  const media = portrait ? character.mobile : character.desktop;
  return [sky, media.poster];
}

/**
 * Loader rápido com progresso real: imagens críticas + fontes.
 * Nunca segura a tela por mais de ~1,5s.
 */
export function Loader() {
  const { setReady } = useExperience();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const started = performance.now();
    const tasks: Promise<unknown>[] = [...criticalAssets().map(preloadImage), document.fonts.ready];
    let finished = 0;
    tasks.forEach((t) =>
      t.then(() => {
        finished += 1;
        setProgress(finished / tasks.length);
      }),
    );

    let closed = false;
    const finish = () => {
      if (closed) return;
      closed = true;
      setProgress(1);
      const gsap = ensureGsap();
      const reduced = prefersReducedMotion();
      gsap
        .timeline({
          onComplete: () => {
            setDone(true);
          },
        })
        .to(root.current!.querySelector(".loader-inner"), { autoAlpha: 0, y: reduced ? 0 : -10, duration: 0.3, ease: "power2.in" }, 0.15)
        .to(root.current, { autoAlpha: 0, duration: reduced ? 0.2 : 0.5, ease: "power2.out" }, 0.3)
        .call(() => setReady(true), [], 0.3);
    };

    const all = Promise.all(tasks).then(() => {
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(finish, wait);
    });
    const cap = window.setTimeout(finish, MAX_MS);
    return () => {
      window.clearTimeout(cap);
      void all;
    };
  }, [setReady]);

  if (done) return null;

  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <div className="loader-inner">
        <span className="loader-name">Allan Ruas</span>
        <span className="loader-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
        <span className="sr-only">Carregando {Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
