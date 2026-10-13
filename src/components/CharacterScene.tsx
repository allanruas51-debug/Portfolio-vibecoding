"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { character, type CharacterMedia } from "@/config/character";
import { hero } from "@/config/site";
import { usePortrait } from "@/lib/media";

const PORTRAIT = "(orientation: portrait)";

type Codec = "hevc" | "webm" | "none";

/**
 * Safari (macOS) e qualquer navegador no iOS usam WebKit, que não suporta
 * alpha em VP9/WebM: para eles vai o HEVC com alpha. O resto usa WebM VP9.
 */
function pickCodec(): Codec {
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const safari = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox|Android/.test(ua);
  const probe = document.createElement("video");
  if (iOS || safari) {
    return probe.canPlayType('video/mp4; codecs="hvc1"') ? "hevc" : "none";
  }
  return probe.canPlayType('video/webm; codecs="vp9"') ? "webm" : "none";
}

const box = (m: CharacterMedia, W: number, H: number) => ({
  left: `${(m.box.x / W) * 100}%`,
  top: `${(m.box.y / H) * 100}%`,
  width: `${(m.box.w / W) * 100}%`,
  height: `${(m.box.h / H) * 100}%`,
});

type Props = {
  /** Reproduz o vídeo (pausa quando a seção não está visível). */
  playing: boolean;
  onActivate: (anchor: HTMLElement) => void;
  className?: string;
  /** Prioridade de carregamento do poster (hero = alta). */
  priority?: boolean;
  /** Ocupa o elemento pai em vez da posição no palco (ex.: dock). */
  fill?: boolean;
};

/**
 * Lua + boneco: poster estático (sem JS) trocado pelo vídeo com alpha
 * assim que ele começa a tocar. É um <button> para ser acessível.
 */
export const CharacterScene = forwardRef<HTMLButtonElement, Props>(function CharacterScene(
  { playing, onActivate, className = "", priority = false, fill = false },
  ref,
) {
  const portrait = usePortrait();
  const media = portrait ? character.mobile : character.desktop;
  const videoRef = useRef<HTMLVideoElement>(null);
  const headRef = useRef<HTMLSpanElement>(null);
  const [codec, setCodec] = useState<Codec | null>(null);
  const [videoOn, setVideoOn] = useState(false);

  useEffect(() => {
    // decisão só no cliente: depende do navegador
    setCodec(pickCodec());
  }, []);

  // troca de orientação = outro vídeo: volta para o poster até tocar
  useEffect(() => {
    setVideoOn(false);
  }, [portrait]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, codec, portrait]);

  const src = codec === "hevc" ? media.hevc : codec === "webm" ? media.webm : null;

  return (
    <div
      className={`char-pos ${fill ? "char-fill" : ""} ${className}`}
      style={
        {
          "--l-d": box(character.desktop, 1672, 941).left,
          "--t-d": box(character.desktop, 1672, 941).top,
          "--w-d": box(character.desktop, 1672, 941).width,
          "--h-d": box(character.desktop, 1672, 941).height,
          "--l-m": box(character.mobile, 940, 1672).left,
          "--t-m": box(character.mobile, 940, 1672).top,
          "--w-m": box(character.mobile, 940, 1672).width,
          "--h-m": box(character.mobile, 940, 1672).height,
          "--r-d": `${character.desktop.box.rot ?? 0}deg`,
          "--r-m": `${character.mobile.box.rot ?? 0}deg`,
          "--head-x": `${media.head.x * 100}%`,
          "--head-y": `${media.head.y * 100}%`,
        } as React.CSSProperties
      }
    >
      <div className="char-float">
        <button
          ref={ref}
          type="button"
          className="char-btn inset-0"
          aria-label={hero.characterLabel}
          onClick={() => headRef.current && onActivate(headRef.current)}
        >
          <span className="char-tilt absolute inset-0 block">
            <span className="char-media" aria-hidden="true">
              <picture>
                <source media={PORTRAIT} srcSet={character.mobile.poster} type="image/webp" />
                <img
                  src={character.desktop.poster}
                  width={character.desktop.size.w}
                  height={character.desktop.size.h}
                  alt=""
                  decoding="async"
                  fetchPriority={priority ? "high" : "auto"}
                  loading={priority ? "eager" : "lazy"}
                  className="char-poster"
                  data-hidden={videoOn}
                />
              </picture>
              {src && (
                <video
                  key={src}
                  ref={videoRef}
                  src={src}
                  muted
                  loop
                  playsInline
                  autoPlay={playing}
                  preload="auto"
                  disablePictureInPicture
                  data-visible={videoOn}
                  onPlaying={() => setVideoOn(true)}
                />
              )}
            </span>
            <picture>
              <source media={PORTRAIT} srcSet={character.mobile.glow} type="image/webp" />
              <img
                src={character.desktop.glow}
                width={character.desktop.size.w}
                height={character.desktop.size.h}
                alt=""
                className="char-glow"
                decoding="async"
              />
            </picture>
          </span>
          <span ref={headRef} className="char-head" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
