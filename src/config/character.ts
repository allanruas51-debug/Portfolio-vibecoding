/**
 * Geometria e mídia do boneco animado, por versão (desktop/mobile).
 * Gerado/ajustado por scripts/assets/video.py — `box` está em px de
 * referência do palco (1672×941 no desktop, 940×1672 no mobile) e
 * `head` é a posição da cabeça em fração do box (âncora do balão).
 */
export type CharacterMedia = {
  box: { x: number; y: number; w: number; h: number; rot?: number };
  head: { x: number; y: number };
  webm: string;
  hevc: string;
  poster: string;
  glow: string;
  /** Tamanho intrínseco do poster/glow (px), para width/height no <img>. */
  size: { w: number; h: number };
};

export const character: Record<"desktop" | "mobile", CharacterMedia> = {
  desktop: {
    box: { x: 171.2, y: 43.9, w: 957.8, h: 879.7, rot: 0.75 },
    head: { x: 0.52, y: 0.22 },
    webm: "/media/boneco-desktop.webm",
    hevc: "/media/boneco-desktop.mov",
    poster: "/media/boneco-desktop-poster.webp",
    glow: "/media/boneco-desktop-glow.webp",
    size: { w: 900, h: 826 },
  },
  mobile: {
    box: { x: 43.0, y: 635.8, w: 854.3, h: 823.3, rot: 0.73 },
    head: { x: 0.45, y: 0.13 },
    webm: "/media/boneco-mobile.webm",
    hevc: "/media/boneco-mobile.mov",
    poster: "/media/boneco-mobile-poster.webp",
    glow: "/media/boneco-mobile-glow.webp",
    size: { w: 720, h: 694 },
  },
};
