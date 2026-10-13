"use client";

import { useSyncExternalStore } from "react";

const subscribers = new Map<string, (cb: () => void) => () => void>();

function subscribeQuery(query: string) {
  const cached = subscribers.get(query);
  if (cached) return cached;
  const subscribe = (cb: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  };
  subscribers.set(query, subscribe);
  return subscribe;
}

/** Hook de media query compatível com SSR (servidor sempre devolve `fallback`). */
export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    subscribeQuery(query),
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export const usePortrait = () => useMediaQuery("(orientation: portrait)");
export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
