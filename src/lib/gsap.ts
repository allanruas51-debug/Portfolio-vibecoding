"use client";

import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

let registered = false;

/** Registra os plugins uma única vez (no cliente). */
export function ensureGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(Observer);
    registered = true;
  }
  return gsap;
}

export { gsap, Observer };
