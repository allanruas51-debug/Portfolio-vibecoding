"""Gera a máscara das nuvens de primeiro plano (camada 5) a partir do próprio
céu limpo: brilho das nuvens × região (faixa inferior, mais forte à esquerda).
Saída: PNG só com alpha, usado como CSS mask-image sobre a mesma imagem do céu."""
import sys, cv2, numpy as np

def build(src, dst, out_w, region):
    im = cv2.imread(src)
    h, w = im.shape[:2]
    lum = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32) / 255
    lum = cv2.GaussianBlur(lum, (0, 0), 2)
    cloud = np.clip((lum - region["lum_lo"]) / (region["lum_hi"] - region["lum_lo"]), 0, 1)
    ys = np.linspace(0, 1, h)[:, None]
    xs = np.linspace(0, 1, w)[None, :]
    # rampa vertical: começa em y0 e fica cheia em y1
    vy = np.clip((ys - region["y0"]) / (region["y1"] - region["y0"]), 0, 1)
    # a borda da rampa sobe à esquerda (nuvens altas no canto inferior esquerdo)
    lift = region["lift"] * np.clip(1 - xs / region["lift_x"], 0, 1) ** 1.5
    vy = np.clip((ys - region["y0"] + lift) / (region["y1"] - region["y0"]), 0, 1)
    a = np.clip(cloud * 1.15, 0, 1) * (vy ** 1.4)
    a = np.maximum(a, np.clip((ys - region["solid"]) / 0.04, 0, 1) * 0.9)
    a = cv2.GaussianBlur(a, (0, 0), 3)
    out_h = round(out_w * h / w)
    a = cv2.resize(a, (out_w, out_h), interpolation=cv2.INTER_AREA)
    rgba = np.zeros((out_h, out_w, 4), np.uint8)
    rgba[:, :, 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    cv2.imwrite(dst, rgba)

DESKTOP = dict(lum_lo=0.42, lum_hi=0.78, y0=0.85, y1=0.96, lift=0.17, lift_x=0.36, solid=0.99)
MOBILE = dict(lum_lo=0.38, lum_hi=0.74, y0=0.80, y1=0.91, lift=0.15, lift_x=0.5, solid=0.995)

if __name__ == "__main__":
    build("assets/source/bg-desktop-limpo.jpg", "public/media/fg-mask-desktop.png", 836, DESKTOP)
    build("assets/source/bg-mobile-limpo.png", "public/media/fg-mask-mobile.png", 470, MOBILE)
