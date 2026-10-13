"use client";

import type { gsap } from "gsap";

/** Direção da navegação: 1 = indo para a próxima seção, -1 = voltando. */
export type Direction = 1 | -1;

/**
 * Contrato de transição de uma seção. O FullpageController monta uma única
 * timeline e pede para a seção que sai e para a que entra adicionarem seus
 * tweens nela. Assim toda seção nova só precisa implementar `enter`/`leave`.
 */
export type SectionTransition = {
  enter: (tl: gsap.core.Timeline, dir: Direction, reduced: boolean) => void;
  leave: (tl: gsap.core.Timeline, dir: Direction, reduced: boolean) => void;
};

export type SectionProps = {
  id: string;
  /** Seção atual (recebe foco/teclado). */
  active: boolean;
  /** Visível na tela (a atual e, durante a transição, a que está saindo). */
  visible: boolean;
  register: (api: SectionTransition) => void;
};

export type SectionDefinition = {
  id: string;
  label: string;
  Component: React.ComponentType<SectionProps>;
};

/** Wrapper semântico comum a todas as seções do fullpage. */
export function Section({
  id,
  label,
  active,
  visible,
  children,
  className = "",
}: {
  id: string;
  label: string;
  active: boolean;
  visible: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      data-visible={visible}
      aria-hidden={!active}
      inert={!active}
      tabIndex={-1}
      className={`fp-section ${className}`}
    >
      {children}
    </section>
  );
}
