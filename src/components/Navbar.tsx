"use client";

import { useEffect, useRef } from "react";
import { hero, nav, site, whatsappUrl } from "@/config/site";
import { ensureGsap } from "@/lib/gsap";
import { useFinePointer, useReducedMotion } from "@/lib/media";
import { MobileMenu } from "./MobileMenu";

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 12h15m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Botão pill "→ Falar com a gente", com hover magnético só em ponteiro fino. */
export function CtaPill({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduced) return;
    const gsap = ensureGsap();
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo(((e.clientX - (r.left + r.width / 2)) / r.width) * 14);
      yTo(((e.clientY - (r.top + r.height / 2)) / r.height) * 10);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [fine, reduced]);

  return (
    <a
      ref={ref}
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`pill ui-cta ${className}`}
      data-ui
    >
      <span className="pill-icon">
        <ArrowIcon className="w-[1.35em]" />
      </span>
      <span className="pill-label">
        {hero.cta}
        <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
      </span>
    </a>
  );
}

export function Navbar() {
  return (
    <header className="ui-header">
      <a href="#hero" className="ui-logo" aria-label={`${site.name}, início`} data-ui>
        {site.name}
      </a>
      <nav aria-label="Principal" className="ui-nav" data-ui>
        <ul>
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="nav-link">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <MobileMenu />
      <CtaPill />
    </header>
  );
}
