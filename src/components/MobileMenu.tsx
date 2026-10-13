"use client";

import { useEffect, useId, useRef, useState } from "react";
import { nav } from "@/config/site";
import { ensureGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/media";

/**
 * Menu hambúrguer: só aparece em telas retrato estreitas, onde a linha de
 * links do design não cabe (ver `.ui-burger` no CSS).
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const gsap = ensureGsap();
    const reduced = prefersReducedMotion();
    const items = panel.querySelectorAll("li");
    if (open) {
      gsap.set(panel, { display: "flex" });
      gsap.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.15 : 0.35, ease: "power2.out" });
      if (!reduced) {
        gsap.fromTo(items, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5, ease: "power3.out", delay: 0.08 });
      }
      panel.querySelector("a")?.focus();
    } else {
      gsap.to(panel, {
        autoAlpha: 0,
        duration: reduced ? 0.1 : 0.25,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(panel, { display: "none" });
        },
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="ui-burger"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
        data-open={open}
        data-ui
      >
        <span />
        <span />
      </button>
      <div ref={panelRef} id={id} className="ui-burger-panel" style={{ display: "none" }}>
        <nav aria-label="Menu">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="nav-link" onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
