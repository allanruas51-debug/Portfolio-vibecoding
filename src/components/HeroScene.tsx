"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { hero } from "@/config/site";
import { ensureGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/media";
import { CharacterScene } from "./CharacterScene";
import { useExperience } from "./ExperienceProvider";
import { Navbar } from "./Navbar";
import { Particles } from "./Particles";
import { ScrollIndicator } from "./ScrollIndicator";
import { Section, type SectionProps } from "./Section";
import { SkyBack, SkyFront } from "./SkyLayers";
import { useParallax } from "./useParallax";

/** Palavra de rótulo; o ponto final some no layout mobile (como na ref). */
function Word({ text }: { text: string }) {
  if (!text.endsWith(".")) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, -1)}
      <span className="ui-dot">.</span>
    </span>
  );
}

/**
 * HERO: céu → horizonte/raios → título → lua+boneco → nuvens da frente →
 * partículas → vinheta → UI. Cada camada tem `data-depth` para o parallax.
 */
export function HeroScene({ id, active, visible, register }: SectionProps) {
  const { ready, speak } = useExperience();
  const root = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const horizon = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const charLayer = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const ui = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const charBtn = useRef<HTMLButtonElement>(null);
  const entered = useRef(false);

  useParallax(root, active && ready);

  // estado inicial escondido (o loader cobre a tela até aqui)
  useLayoutEffect(() => {
    const gsap = ensureGsap();
    if (prefersReducedMotion()) {
      gsap.set([sky.current, horizon.current, title.current, charLayer.current, front.current], { autoAlpha: 0 });
      gsap.set(ui.current!.querySelectorAll("[data-ui]"), { autoAlpha: 0 });
      return;
    }
    gsap.set(sky.current, { autoAlpha: 0, scale: 1.18 });
    gsap.set(horizon.current, { autoAlpha: 0, y: 60 });
    gsap.set(title.current!.querySelector("h1"), { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(charLayer.current, { autoAlpha: 0, y: 140 });
    gsap.set(front.current, { autoAlpha: 0, y: 90 });
    gsap.set(ui.current!.querySelectorAll("[data-ui]"), { autoAlpha: 0, y: 16 });
  }, []);

  // coreografia de entrada
  useEffect(() => {
    if (!ready || entered.current) return;
    entered.current = true;
    const gsap = ensureGsap();
    const uiItems = ui.current!.querySelectorAll("[data-ui]");
    if (prefersReducedMotion()) {
      gsap.to([sky.current, horizon.current, title.current, charLayer.current, front.current, ...uiItems], {
        autoAlpha: 1,
        duration: 0.4,
      });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(sky.current, { autoAlpha: 1, scale: 1, duration: 1.8 }, 0)
      .to(horizon.current, { autoAlpha: 1, y: 0, duration: 1.5 }, 0.15)
      .to(front.current, { autoAlpha: 1, y: 0, duration: 1.5 }, 0.3)
      .to(title.current!.querySelector("h1"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.out" }, 0.45)
      .to(charLayer.current, { autoAlpha: 1, y: 0, duration: 1.6, ease: "power3.out" }, 0.6)
      .to(uiItems, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" }, 1.0);
    return () => {
      tl.progress(1);
    };
  }, [ready]);

  // float + respiração (pausados fora da hero)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const gsap = ensureGsap();
    const float = charLayer.current!.querySelector(".char-float");
    const tween = gsap.fromTo(float, { y: -6 }, { y: 6, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    if (!visible) tween.pause();
    return () => {
      tween.kill();
    };
  }, [visible]);

  const onActivate = useCallback(
    (anchor: HTMLElement) => {
      const gsap = ensureGsap();
      const tilt = charLayer.current?.querySelector(".char-tilt");
      if (tilt && !prefersReducedMotion()) {
        // "levanta a cabeça": tilt rápido (~300ms) sem parar a digitação
        gsap
          .timeline()
          .to(tilt, { rotation: -2.2, y: -10, duration: 0.12, ease: "power2.out", transformOrigin: "50% 80%" })
          .to(tilt, { rotation: 0, y: 0, duration: 0.2, ease: "power2.inOut" });
      }
      speak(anchor);
    },
    [speak],
  );

  // transições do fullpage: "câmera entrando nas nuvens"
  useEffect(() => {
    register({
      leave: (tl, _dir, reduced) => {
        if (reduced) {
          tl.to(root.current, { autoAlpha: 0, duration: 0.3, ease: "power1.out" }, 0);
          return;
        }
        tl.to(ui.current, { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.in" }, 0)
          .to(sky.current, { scale: 1.25, duration: 1.2 }, 0)
          .to(horizon.current, { scale: 1.55, yPercent: -4, duration: 1.2 }, 0)
          .to(title.current, { scale: 1.5, autoAlpha: 0, filter: "blur(14px)", duration: 0.9, ease: "power2.in" }, 0)
          .to(charLayer.current, { scale: 1.9, yPercent: -12, autoAlpha: 0, duration: 1.0, ease: "power2.in" }, 0.05)
          .to(front.current, { scale: 3.2, yPercent: -30, duration: 1.2 }, 0)
          .to(veil.current, { autoAlpha: 1, duration: 0.55, ease: "power1.in" }, 0.5)
          .set(root.current, { autoAlpha: 0 }, 1.2);
      },
      enter: (tl, _dir, reduced) => {
        if (reduced) {
          tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" }, 0.15);
          return;
        }
        tl.set(root.current, { autoAlpha: 1 }, 0.55)
          .fromTo(veil.current, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.7, ease: "power1.out" }, 0.55)
          .fromTo(front.current, { scale: 3.2, yPercent: -30 }, { scale: 1, yPercent: 0, duration: 1.3, ease: "expo.out" }, 0.55)
          .fromTo(sky.current, { scale: 1.25 }, { scale: 1, duration: 1.3, ease: "expo.out" }, 0.55)
          .fromTo(horizon.current, { scale: 1.55, yPercent: -4 }, { scale: 1, yPercent: 0, duration: 1.3, ease: "expo.out" }, 0.55)
          .fromTo(
            title.current,
            { scale: 1.5, autoAlpha: 0, filter: "blur(14px)" },
            { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1.1, ease: "expo.out", clearProps: "filter" },
            0.7,
          )
          .fromTo(
            charLayer.current,
            { scale: 1.9, yPercent: -12, autoAlpha: 0 },
            { scale: 1, yPercent: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out" },
            0.75,
          )
          .fromTo(ui.current, { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.0);
      },
    });
  }, [register]);

  return (
    <Section id={id} label="Início" active={active} visible={visible} className="hero">
      <div ref={root} className="absolute inset-0 hero-root">
        <SkyBack skyRef={sky} ref={horizon} />

        <div ref={title} className="layer title-layer" data-depth="0.6" data-tilt="3">
          <h1 className="hero-title">
            <span className="word">{hero.title[0]}</span> <span className="word">{hero.title[1]}</span>
          </h1>
        </div>

        <div ref={charLayer} className="layer char-layer" data-depth="0.9" data-tilt="6">
          <div className="stage">
            <CharacterScene ref={charBtn} playing={visible} onActivate={onActivate} priority />
          </div>
        </div>

        <SkyFront ref={front} />
        <Particles running={visible && ready} />
        <div className="layer grade" aria-hidden="true" />

        <div ref={ui} className="ui">
          <Navbar />
          <p className="ui-at ui-tagline" data-ui>
            <span className="ui-label ui-stack">
              {hero.tagline.map((w) => (
                <Word key={w} text={w} />
              ))}
            </span>
            <span className="rule" />
          </p>
          <p className="ui-at ui-pillars" data-ui>
            <span className="ui-label ui-stack">
              {hero.pillars.map((w) => (
                <Word key={w} text={w} />
              ))}
            </span>
            <span className="rule" />
          </p>
          <ScrollIndicator />
        </div>

        <div ref={veil} className="layer cloud-veil" aria-hidden="true" />
      </div>
    </Section>
  );
}
