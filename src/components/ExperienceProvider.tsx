"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type SpeakListener = (anchor: HTMLElement) => void;

type ExperienceState = {
  /** O loader terminou e a coreografia de entrada pode rodar. */
  ready: boolean;
  setReady: (ready: boolean) => void;
  /** Seção ativa do fullpage. */
  index: number;
  setIndex: (index: number) => void;
  /** Pede ao controlador para navegar até uma seção (por índice ou id). */
  goTo: (target: number | string) => void;
  registerGoTo: (fn: (target: number | string) => void) => void;
  /** O boneco "fala": abre o balão ancorado no elemento informado. */
  speak: (anchor: HTMLElement) => void;
  onSpeak: (fn: SpeakListener) => () => void;
};

const ExperienceContext = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const goToRef = useRef<(target: number | string) => void>(() => {});
  const speakListeners = useRef(new Set<SpeakListener>());

  const goTo = useCallback((target: number | string) => goToRef.current(target), []);
  const registerGoTo = useCallback((fn: (target: number | string) => void) => {
    goToRef.current = fn;
  }, []);
  const speak = useCallback((anchor: HTMLElement) => {
    speakListeners.current.forEach((fn) => fn(anchor));
  }, []);
  const onSpeak = useCallback((fn: SpeakListener) => {
    speakListeners.current.add(fn);
    return () => {
      speakListeners.current.delete(fn);
    };
  }, []);

  const value = useMemo(
    () => ({ ready, setReady, index, setIndex, goTo, registerGoTo, speak, onSpeak }),
    [ready, index, goTo, registerGoTo, speak, onSpeak],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience precisa estar dentro de <ExperienceProvider>");
  return ctx;
}
