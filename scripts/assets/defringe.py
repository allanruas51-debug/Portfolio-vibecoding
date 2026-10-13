"""Limpa a franja dos recortes PNG sem alterar o conteúdo:
1) remove ilhas soltas no alpha (faíscas/pixels dourados desconectados);
2) erode 1px do alpha (corta a franja de matting) com anti-alias leve;
3) pixels de borda muito transparentes (alpha < 96) têm a cor puxada
   para o vizinho opaco mais próximo, matando o halo dourado/branco."""
import sys, cv2, numpy as np

def defringe(src, dst, erode=1, min_island=400):
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    rgb, a = im[:, :, :3], im[:, :, 3].copy()
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 8).astype(np.uint8), 8)
    keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= min_island
    a[~keep[lab]] = 0
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * erode + 1, 2 * erode + 1))
    a2 = np.minimum(cv2.GaussianBlur(cv2.erode(a, k), (3, 3), 0.5), a)
    # cor do vizinho opaco mais próximo, só na franja muito transparente
    solid = (a2 >= 200).astype(np.uint8)
    _, idx = cv2.distanceTransformWithLabels(1 - solid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(solid)
    lut = np.zeros((idx.max() + 1, 2), np.int32)
    lut[idx[ys, xs]] = np.stack([ys, xs], 1)
    near = rgb[lut[idx][..., 0], lut[idx][..., 1]]
    fringe = ((a2 > 0) & (a2 < 96))[..., None]
    out_rgb = np.where(fringe, near, rgb)
    out = np.dstack([out_rgb, a2]); out[a2 == 0, :3] = 0
    cv2.imwrite(dst, out)
    print(src, "ilhas removidas:", int((~keep[1:]).sum()))

if __name__ == "__main__":
    defringe(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1)
