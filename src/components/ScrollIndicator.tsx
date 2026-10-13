"use client";

import { hero } from "@/config/site";
import { useExperience } from "./ExperienceProvider";

/**
 * "Scroll para explorar": linha animada (desktop) / mouse (mobile).
 * É um botão: clicar leva para a próxima seção.
 */
export function ScrollIndicator() {
  const { goTo, index } = useExperience();
  return (
    <button type="button" className="ui-scroll" onClick={() => goTo(index + 1)} data-ui>
      <span className="ui-scroll-line scroll-line" aria-hidden="true" />
      <svg className="ui-scroll-mouse" viewBox="0 0 24 64" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="22" height="62" rx="11" stroke="currentColor" strokeWidth="1.6" />
        <path className="mouse-wheel" d="M12 22v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="ui-label ui-stack">
        {hero.scroll.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </span>
    </button>
  );
}
