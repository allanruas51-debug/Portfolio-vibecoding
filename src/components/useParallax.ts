"use client";

import { useEffect } from "react";
import { ensureGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/media";

/** Deslocamento máximo (px) de uma camada com data-depth = 1. */
const SHIFT_X = 18;
const SHIFT_Y = 12;

type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/**
 * Parallax 3D da hero. Cada `[data-depth]` desloca proporcionalmente à
 * profundidade e `[data-tilt]` inclina (graus máx.). Entrada: mouse no
 * desktop, giroscópio no mobile (no iOS a permissão é pedida só depois do
 * primeiro toque) e arrasto horizontal como alternativa.
 */
export function useParallax(root: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el || !enabled || prefersReducedMotion()) return;
    const gsap = ensureGsap();

    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]")).map((node) => {
      const depth = parseFloat(node.dataset.depth || "0");
      const tilt = parseFloat(node.dataset.tilt || "0");
      // as camadas do palco ganham um pouco de escala para não revelar borda
      if (!tilt) gsap.set(node, { scale: 1 + depth * 0.025, transformPerspective: 1200 });
      else gsap.set(node, { transformPerspective: 1200 });
      return {
        x: gsap.quickTo(node, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(node, "y", { duration: 1.1, ease: "power3.out" }),
        rx: tilt ? gsap.quickTo(node, "rotationX", { duration: 1.2, ease: "power3.out" }) : null,
        ry: tilt ? gsap.quickTo(node, "rotationY", { duration: 1.2, ease: "power3.out" }) : null,
        depth,
        tilt,
      };
    });

    /** nx, ny ∈ [-1, 1] */
    const apply = (nx: number, ny: number) => {
      for (const l of layers) {
        l.x(-nx * SHIFT_X * l.depth);
        l.y(-ny * SHIFT_Y * l.depth);
        l.ry?.(nx * l.tilt);
        l.rx?.(-ny * l.tilt * 0.6);
      }
    };

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const cleanups: (() => void)[] = [];

    // mouse
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      apply((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => apply(0, 0);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    });

    // giroscópio
    let gyroBase: { b: number; g: number } | null = null;
    let gyroActive = false;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      gyroActive = true;
      if (!gyroBase) gyroBase = { b: e.beta, g: e.gamma };
      apply(clamp((e.gamma - gyroBase.g) / 20), clamp((e.beta - gyroBase.b) / 20));
    };
    const startGyro = () => window.addEventListener("deviceorientation", onOrientation, { passive: true });
    const DOE = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : undefined) as
      | DeviceOrientationEventIOS
      | undefined;
    if (DOE?.requestPermission) {
      const ask = () => {
        DOE.requestPermission!()
          .then((r) => r === "granted" && startGyro())
          .catch(() => {});
      };
      window.addEventListener("touchend", ask, { once: true });
      cleanups.push(() => window.removeEventListener("touchend", ask));
    } else if (DOE) {
      startGyro();
    }
    cleanups.push(() => window.removeEventListener("deviceorientation", onOrientation));

    // arrasto (toque sem giroscópio): segue o dedo e volta ao centro ao soltar
    let start: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (gyroActive) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!start || gyroActive) return;
      const t = e.touches[0];
      apply(clamp(((t.clientX - start.x) / window.innerWidth) * 2.5), clamp(((t.clientY - start.y) / window.innerHeight) * 2.5));
    };
    const onTouchEnd = () => {
      start = null;
      if (!gyroActive) apply(0, 0);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    cleanups.push(() => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    });

    return () => {
      cleanups.forEach((fn) => fn());
      apply(0, 0);
    };
  }, [root, enabled]);
}
