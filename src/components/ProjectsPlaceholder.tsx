"use client";

import { useEffect, useRef } from "react";
import { Section, type SectionProps } from "./Section";

/**
 * Seção 2 (placeholder) — existe para validar a transição de ida e volta.
 * Substitua pelo componente real de Projetos mantendo o contrato enter/leave.
 */
export function ProjectsPlaceholder({ id, active, visible, register }: SectionProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    register({
      enter: (tl, _dir, reduced) => {
        const items = root.current!.querySelectorAll("[data-reveal]");
        if (reduced) {
          tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.15);
          return;
        }
        tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: "power1.out" }, 0.95).fromTo(
          items,
          { y: 40, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "expo.out" },
          1.05,
        );
      },
      leave: (tl, _dir, reduced) => {
        tl.to(root.current, { autoAlpha: 0, duration: reduced ? 0.3 : 0.5, ease: "power2.in" }, 0);
      },
    });
  }, [register]);

  return (
    <Section id={id} label="Projetos" active={active} visible={visible} className="projects">
      <div ref={root} className="projects-root" style={{ visibility: "hidden" }}>
        <p className="projects-kicker" data-reveal>
          02 — Projetos
        </p>
        <h2 className="projects-title" data-reveal>
          Em breve, os projetos.
        </h2>
        <p className="projects-text" data-reveal>
          Esta seção é um placeholder para validar a navegação. Use ↑, Page Up ou role para cima para voltar à hero.
        </p>
      </div>
    </Section>
  );
}
