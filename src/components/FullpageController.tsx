"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureGsap, Observer } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/media";
import { useExperience } from "./ExperienceProvider";
import type { Direction, SectionDefinition, SectionTransition } from "./Section";

/** Tempo extra (ms) ignorando wheel depois de uma transição: absorve a inércia do trackpad. */
const COOLDOWN_MS = 450;

const INTERACTIVE = "a, button, input, textarea, select, [contenteditable='true']";

/**
 * Controlador único do fullpage: uma seção por vez, navegando por wheel,
 * trackpad, swipe e teclado (GSAP Observer). Para adicionar uma seção,
 * crie o componente e acrescente-o ao array `sections`.
 */
export function FullpageController({ sections }: { sections: SectionDefinition[] }) {
  const { ready, index, setIndex, registerGoTo } = useExperience();
  const [visible, setVisible] = useState<number[]>([0]);
  const apis = useRef<(SectionTransition | null)[]>([]);
  const current = useRef(0);
  const busy = useRef(false);
  const lockedUntil = useRef(0);

  /** `gesture`: wheel/touch respeitam o cooldown de inércia; teclado e cliques não. */
  const go = useCallback(
    (target: number, gesture = false) => {
      const from = current.current;
      const to = Math.max(0, Math.min(sections.length - 1, target));
      if (to === from || busy.current) return;
      if (gesture && performance.now() < lockedUntil.current) return;
      const gsap = ensureGsap();
      const dir: Direction = to > from ? 1 : -1;
      const reduced = prefersReducedMotion();
      busy.current = true;
      current.current = to;
      setVisible([from, to]);
      setIndex(to);

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          busy.current = false;
          lockedUntil.current = performance.now() + COOLDOWN_MS;
          setVisible([to]);
          // leva o foco para a nova seção (leitores de tela / teclado)
          document.getElementById(sections[to].id)?.focus({ preventScroll: true });
        },
      });
      apis.current[from]?.leave(tl, dir, reduced);
      apis.current[to]?.enter(tl, dir, reduced);
    },
    [sections, setIndex],
  );

  const goTo = useCallback(
    (target: number | string) => {
      const i = typeof target === "number" ? target : sections.findIndex((s) => s.id === target);
      if (i >= 0) go(i);
    },
    [go, sections],
  );

  useEffect(() => registerGoTo(goTo), [goTo, registerGoTo]);

  useEffect(() => {
    if (!ready) return;
    ensureGsap();
    const next = () => go(current.current + 1);
    const prev = () => go(current.current - 1);
    const nextGesture = () => go(current.current + 1, true);
    const prevGesture = () => go(current.current - 1, true);

    // wheelSpeed -1: rolar para baixo e arrastar o dedo para cima viram "onUp"
    const observer = Observer.create({
      target: window,
      type: "wheel,touch",
      wheelSpeed: -1,
      tolerance: 12,
      dragMinimum: 6,
      preventDefault: true,
      onUp: nextGesture,
      onDown: prevGesture,
      // swipes horizontais ficam para o parallax por arrasto
      lockAxis: true,
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      const typing = target?.closest?.(INTERACTIVE);
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case " ":
          if (typing) return;
          e.preventDefault();
          if (e.shiftKey) prev();
          else next();
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          if (typing) return;
          e.preventDefault();
          go(0);
          break;
        case "End":
          if (typing) return;
          e.preventDefault();
          go(sections.length - 1);
          break;
      }
    };

    // links internos (#projetos etc.) navegam pelo controlador
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const i = sections.findIndex((s) => s.id === id);
      if (i >= 0) {
        e.preventDefault();
        go(i);
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      observer.kill();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [ready, go, sections]);

  return (
    <main className="fp-root" data-section={sections[index]?.id}>
      {sections.map(({ id, Component }, i) => (
        <Component
          key={id}
          id={id}
          active={i === index}
          visible={visible.includes(i)}
          register={(api) => {
            apis.current[i] = api;
          }}
        />
      ))}
    </main>
  );
}
