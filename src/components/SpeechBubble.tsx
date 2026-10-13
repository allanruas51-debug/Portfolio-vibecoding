"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { speech, whatsappUrl } from "@/config/site";
import { ensureGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/media";
import { useExperience } from "./ExperienceProvider";
import { ArrowIcon } from "./Navbar";

type Bubble = { key: number; text: string; cta: boolean; anchor: HTMLElement };

const MARGIN = 16;
const TYPE_MS = 26;

/** Lê os insets de safe-area (notch etc.) medindo um elemento temporário. */
function safeArea() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  document.body.appendChild(probe);
  const s = getComputedStyle(probe);
  const out = {
    t: parseFloat(s.paddingTop) || 0,
    r: parseFloat(s.paddingRight) || 0,
    b: parseFloat(s.paddingBottom) || 0,
    l: parseFloat(s.paddingLeft) || 0,
  };
  probe.remove();
  return out;
}

/** Sorteia uma fala diferente da anterior. */
function pickLine(prev: number) {
  const n = speech.lines.length;
  if (n < 2) return 0;
  let i = prev;
  while (i === prev) i = Math.floor(Math.random() * n);
  return i;
}

/**
 * Balão de fala do boneco. Entra com "pop" (spring com overshoot), digita o
 * texto, some sozinho depois de `autoHideMs` (o timer pausa com o mouse em
 * cima ou com foco dentro) e fecha com Esc ou toque fora.
 */
export function SpeechBubble() {
  const { onSpeak, index } = useExperience();
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [typed, setTyped] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const clicks = useRef(0);
  const lastLine = useRef(-1);
  const hideTimer = useRef<number | null>(null);
  const remaining = useRef(speech.autoHideMs);
  const timerStart = useRef(0);
  const paused = useRef(false);

  const clearTimer = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  const close = useCallback(() => {
    clearTimer();
    const el = ref.current;
    if (!el) return setBubble(null);
    const key = Number(el.dataset.key);
    const gsap = ensureGsap();
    gsap.to(el, {
      scale: 0.85,
      autoAlpha: 0,
      duration: prefersReducedMotion() ? 0.1 : 0.18,
      ease: "power2.in",
      // só remove o balão que estava fechando (um clique novo pode ter aberto outro)
      onComplete: () => setBubble((b) => (b && b.key === key ? null : b)),
    });
  }, []);

  // trocou de seção: a âncora (cabeça) sumiu, então o balão também
  useEffect(() => {
    close();
  }, [index, close]);

  const startTimer = useCallback(
    (ms: number) => {
      clearTimer();
      remaining.current = ms;
      timerStart.current = performance.now();
      if (!paused.current) hideTimer.current = window.setTimeout(close, ms);
    },
    [close],
  );

  // novo clique no boneco
  useEffect(
    () =>
      onSpeak((anchor) => {
        clicks.current += 1;
        const cta = clicks.current % speech.ctaEvery === 0;
        let text = speech.cta.text;
        if (!cta) {
          const i = pickLine(lastLine.current);
          lastLine.current = i;
          text = speech.lines[i];
        }
        clearTimer();
        setTyped(prefersReducedMotion() ? text.length : 0);
        setBubble({ key: clicks.current, text, cta, anchor });
      }),
    [onSpeak],
  );

  // posiciona perto da cabeça, sempre dentro da viewport (+ safe-area)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!bubble || !el) return;
    const place = () => {
      const a = bubble.anchor.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      const safe = safeArea();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let top = a.top - b.height - 28;
      let placement: "top" | "bottom" = "top";
      if (top < MARGIN + safe.t) {
        top = a.top + 36;
        placement = "bottom";
      }
      top = Math.min(Math.max(top, MARGIN + safe.t), vh - b.height - MARGIN - safe.b);
      // levemente à direita da cabeça, como num quadrinho
      let left = a.left - b.width * 0.28;
      left = Math.min(Math.max(left, MARGIN + safe.l), vw - b.width - MARGIN - safe.r);
      const tail = Math.min(Math.max(a.left - left, 22), b.width - 22);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.setProperty("--tail-x", `${tail}px`);
      el.dataset.placement = placement;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [bubble]);

  // entrada "pop"
  useLayoutEffect(() => {
    const el = ref.current;
    if (!bubble || !el) return;
    const gsap = ensureGsap();
    if (prefersReducedMotion()) {
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 });
    } else {
      gsap.fromTo(
        el,
        { scale: 0.4, autoAlpha: 0, y: 10 },
        { scale: 1, autoAlpha: 1, y: 0, duration: 0.55, ease: "back.out(2.4)" },
      );
    }
  }, [bubble]);

  // typewriter
  useEffect(() => {
    if (!bubble) return;
    if (typed >= bubble.text.length) {
      startTimer(speech.autoHideMs + (bubble.cta ? 2500 : 0));
      return;
    }
    const t = window.setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
    return () => window.clearTimeout(t);
  }, [bubble, typed, startTimer]);

  // Esc / toque fora
  useEffect(() => {
    if (!bubble) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if ((t as HTMLElement).closest?.(".char-btn")) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [bubble, close]);

  useEffect(() => clearTimer, []);

  const pause = () => {
    if (paused.current) return;
    paused.current = true;
    if (hideTimer.current) {
      remaining.current -= performance.now() - timerStart.current;
      clearTimer();
    }
  };
  const resume = () => {
    if (!paused.current) return;
    paused.current = false;
    if (bubble && typed >= bubble.text.length) startTimer(Math.max(remaining.current, 1200));
  };

  return (
    <>
      {/* texto completo para leitores de tela (o visual é digitado) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {bubble?.text ?? ""}
      </div>
      {bubble && (
        <div
          key={bubble.key}
          ref={ref}
          data-key={bubble.key}
          className="bubble"
          role="group"
          aria-label="Fala do Allan"
          onPointerEnter={pause}
          onPointerLeave={resume}
          onFocus={pause}
          onBlur={resume}
          style={{ left: -9999, top: -9999 }}
        >
          <p aria-hidden="true" className="m-0">
            {bubble.text.slice(0, typed)}
            {typed < bubble.text.length && <span className="caret" />}
            {/* reserva o espaço final para o balão não "crescer" enquanto digita */}
            <span className="invisible">{bubble.text.slice(typed)}</span>
          </p>
          {bubble.cta && (
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bubble-cta"
              onClick={close}
            >
              {speech.cta.button}
              <ArrowIcon className="w-4" />
              <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
            </a>
          )}
          <span className="bubble-tail" aria-hidden="true" />
        </div>
      )}
    </>
  );
}
