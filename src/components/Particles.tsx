"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/media";

const COUNT = 36;

type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; phase: number };

/** Camada 6: partículas de luz discretas (canvas leve, ≤ 40). */
export function Particles({ running }: { running: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !running || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (anywhere: boolean): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 1.6,
      vy: -(6 + Math.random() * 14),
      vx: -4 + Math.random() * 8,
      a: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    });
    const ps = Array.from({ length: COUNT }, () => spawn(true));

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt + Math.sin(now / 1400 + p.phase) * 0.15;
        if (p.y < -10) ps[i] = spawn(false);
        const twinkle = 0.6 + 0.4 * Math.sin(now / 700 + p.phase);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255, 240, 215, ${p.a * twinkle})`);
        g.addColorStop(1, "rgba(255, 220, 170, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      ctx.clearRect(0, 0, w, h);
    };
  }, [running]);

  return <canvas ref={ref} className="layer h-full w-full" data-depth="1.1" aria-hidden="true" />;
}
