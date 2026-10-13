"""
Pipeline D1 — boneco animado com fundo transparente.

Entrada (por versão): frames do vídeo original + máscaras de keyframes
(BiRefNet para o boneco; no mobile, + SAM com pontos na lua).

Etapas:
 1. máscaras dos frames intermediários por optical flow (Farneback) a partir
    dos dois keyframes vizinhos (bidirecional, misturado por t);
 2. estabilização: similaridade de cada frame → frame 0 estimada só com
    features dentro do sujeito (SIFT + RANSAC), suavizada no tempo;
 3. limpeza do alpha (erode 1px + feather) e descontaminação de cor da borda;
 4. loop sem emenda (ping-pong ou crossfade);
 5. recorte no bounding box do sujeito, escala de saída;
 6. registro na arte de referência (onde o boneco fica no palco);
 7. export: WebM VP9 alpha, HEVC alpha (.mov hvc1), poster WebP e glow do neon.

Uso: python scripts/assets/video.py desktop|mobile <frames_dir> <mask_dirs,...> <work_dir>
"""
import glob
import json
import os
import subprocess
import sys

import cv2
import numpy as np

FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
FFMPEG_HEVC = os.environ.get("FFMPEG_HEVC", "/opt/ff8/bin/ffmpeg")

CFG = {
    "desktop": dict(
        ref="assets/source/ref-desktop.png",
        first=1, last=97, fps=24, loop="pingpong", out_w=900,
        # a câmera faz pan: nos primeiros frames um arco do fundo encosta na
        # lua. A região válida do sujeito vem dos frames >= 40.
        region_from=40,
    ),
    "mobile": dict(
        ref="assets/source/ref-mobile.png",
        first=1, last=118, fps=30, loop="crossfade", xfade=8, out_w=720,
    ),
}


def load_masks(mask_dirs, idx):
    m = None
    for d in mask_dirs:
        p = os.path.join(d, f"{idx:04d}.png")
        if not os.path.exists(p):
            return None
        a = cv2.imread(p, 0)
        m = a if m is None else np.maximum(m, a)
    return m


def flow_warp(mask, gray_from, gray_to):
    """Leva `mask` (alinhada a gray_to) para o frame gray_from."""
    flow = cv2.calcOpticalFlowFarneback(gray_from, gray_to, None, 0.5, 4, 21, 4, 7, 1.5, 0)
    h, w = mask.shape
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(mask, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderValue=0)


def interpolate_masks(frames, keymasks):
    keys = sorted(keymasks)
    grays = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in frames]
    out = []
    for i in range(len(frames)):
        if i in keymasks:
            out.append(keymasks[i].astype(np.float32))
            continue
        k0 = max(k for k in keys if k < i)
        k1 = min(k for k in keys if k > i)
        t = (i - k0) / (k1 - k0)
        a = flow_warp(keymasks[k0], grays[i], grays[k0]).astype(np.float32)
        b = flow_warp(keymasks[k1], grays[i], grays[k1]).astype(np.float32)
        out.append((1 - t) * a + t * b)
    return out


def estimate_stabilization(frames, masks):
    sift = cv2.SIFT_create(4000)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))

    def feats(i):
        m = cv2.erode((masks[i] > 128).astype(np.uint8) * 255, k)
        return sift.detectAndCompute(cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY), m)

    k0, d0 = feats(0)
    bf = cv2.BFMatcher()
    params = []
    for i in range(len(frames)):
        if i == 0:
            params.append((1.0, 0.0, 0.0, 0.0))
            continue
        ki, di = feats(i)
        good = [m for m, n in bf.knnMatch(di, d0, k=2) if m.distance < 0.75 * n.distance]
        src = np.float32([ki[m.queryIdx].pt for m in good])
        dst = np.float32([k0[m.trainIdx].pt for m in good])
        A, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.5)
        s = float(np.hypot(A[0, 0], A[1, 0]))
        r = float(np.arctan2(A[1, 0], A[0, 0]))
        params.append((s, r, float(A[0, 2]), float(A[1, 2])))
    p = np.array(params)
    # suaviza (média móvel) para não transformar jitter de estimativa em tremor
    ks = 5
    pad = np.pad(p, ((ks // 2, ks // 2), (0, 0)), mode="edge")
    sm = np.stack([np.convolve(pad[:, j], np.ones(ks) / ks, mode="valid") for j in range(4)], 1)
    mats = []
    for s, r, tx, ty in sm:
        mats.append(np.array([[s * np.cos(r), -s * np.sin(r), tx], [s * np.sin(r), s * np.cos(r), ty]], np.float32))
    return mats, p


def clean_alpha(rgb, alpha):
    a = alpha.astype(np.float32) / 255
    # corta o halo de matting: erode 1px e reforça o núcleo
    a = cv2.erode(a, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    a = np.clip((a - 0.06) / 0.88, 0, 1)
    a8 = (a * 255).astype(np.uint8)
    # remove ilhas soltas (nuvens/arcos do fundo): fica só o componente
    # principal e o que encosta nele (até 25px de distância)
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a8 > 20).astype(np.uint8), 8)
    if n > 2:
        main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        near = cv2.dilate((lab == main).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (51, 51)))
        keep = np.zeros(n, bool)
        keep[np.unique(lab[near > 0])] = True
        keep[0] = False
        a8[~keep[lab]] = 0
    # descontaminação: na franja (alpha baixo) usa a cor do pixel sólido mais próximo
    solid = (a8 >= 200).astype(np.uint8)
    if solid.any():
        _, idx = cv2.distanceTransformWithLabels(1 - solid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
        ys, xs = np.nonzero(solid)
        lut = np.zeros((idx.max() + 1, 2), np.int32)
        lut[idx[ys, xs]] = np.stack([ys, xs], 1)
        near = rgb[lut[idx][..., 0], lut[idx][..., 1]]
        edge = ((a8 > 0) & (a8 < 150))[..., None]
        rgb = np.where(edge, near, rgb)
    return rgb, a8


def make_loop(rgba, mode, xfade):
    if mode == "pingpong":
        return rgba + rgba[-2:0:-1]
    n = len(rgba)
    out = []
    for i in range(n - xfade):
        if i < xfade:
            t = (i + 1) / (xfade + 1)
            a = rgba[n - xfade + i].astype(np.float32)
            b = rgba[i].astype(np.float32)
            out.append(((1 - t) * a + t * b).astype(np.uint8))
        else:
            out.append(rgba[i])
    return out


def register_to_ref(rgb, alpha, ref_path, refmask_path):
    """Similaridade recorte do vídeo → arte de referência.

    SIFT entre o sujeito do vídeo e o boneco da ref (máscara BiRefNet da ref),
    refinado por ECC (afim) na região do boneco. Devolve matriz 2×3."""
    ref = cv2.imread(ref_path)
    rm = cv2.imread(refmask_path, 0)
    sift = cv2.SIFT_create(8000)
    rmd = cv2.dilate((rm > 128).astype(np.uint8) * 255, np.ones((25, 25), np.uint8))
    ka, da = sift.detectAndCompute(cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY), (alpha > 128).astype(np.uint8) * 255)
    kb, db = sift.detectAndCompute(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), rmd)
    good = [m for m, n in cv2.BFMatcher().knnMatch(da, db, k=2) if m.distance < 0.8 * n.distance]
    src = np.float32([ka[m.queryIdx].pt for m in good])
    dst = np.float32([kb[m.trainIdx].pt for m in good])
    A, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=5)
    tmpl = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY).astype(np.float32)
    h, w = tmpl.shape
    warped = cv2.warpAffine(cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY).astype(np.float32), A, (w, h))
    M = np.eye(2, 3, dtype=np.float32)
    cc = None
    try:
        cc, M = cv2.findTransformECC(tmpl, warped, M, cv2.MOTION_AFFINE,
                                     (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6),
                                     (rm > 128).astype(np.uint8), 5)
    except cv2.error:
        pass
    F = (np.vstack([cv2.invertAffineTransform(M), [0, 0, 1]]) @ np.vstack([A, [0, 0, 1]]))[:2]
    return F, int(inl.sum()), len(good), cc


def run(version, frames_dir, mask_dirs, work):
    cfg = CFG[version]
    os.makedirs(work, exist_ok=True)
    idxs = list(range(cfg["first"], cfg["last"] + 1))
    frames = [cv2.imread(os.path.join(frames_dir, f"{i:04d}.png")) for i in idxs]
    keymasks = {}
    for j, i in enumerate(idxs):
        m = load_masks(mask_dirs, i)
        if m is not None:
            keymasks[j] = m
    print(version, "frames", len(frames), "keyframes", len(keymasks), flush=True)
    masks = interpolate_masks(frames, keymasks)

    mats, raw = estimate_stabilization(frames, masks)
    np.savetxt(os.path.join(work, "stab_params.txt"), raw, fmt="%.5f", header="scale rot tx ty (frame->frame0)")
    h, w = frames[0].shape[:2]
    stab_rgb, stab_a = [], []
    for f, m, M in zip(frames, masks, mats):
        stab_rgb.append(cv2.warpAffine(f, M, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE))
        stab_a.append(cv2.warpAffine(np.clip(m, 0, 255).astype(np.uint8), M, (w, h), flags=cv2.INTER_LINEAR))

    # alpha: suavização temporal leve (média de 3) contra flicker
    sm = []
    for i in range(len(stab_a)):
        win = [stab_a[j].astype(np.float32) for j in range(max(0, i - 1), min(len(stab_a), i + 2))]
        sm.append(np.mean(win, 0).astype(np.uint8))

    if cfg.get("region_from"):
        # pixel conta como sujeito se aparece em >= 15% desses frames
        # (o arco do fundo só "encosta" em frames isolados)
        tail = np.stack(sm[cfg["region_from"]:])
        region = ((tail > 20).mean(0) >= 0.15).astype(np.uint8)
        # abertura forte quebra o "pescoço" que liga o arco à lua; fica só
        # o maior componente (lua + boneco)
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35))
        opened = cv2.erode(region, k)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(opened, 8)
        if n > 2:
            opened = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
        region = cv2.dilate(opened, k) & region
        region = cv2.dilate(region, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
        region = cv2.GaussianBlur(region.astype(np.float32), (0, 0), 6)
        sm = [(a * region).astype(np.uint8) for a in sm]
        cv2.imwrite(os.path.join(work, "region.png"), (region * 255).astype(np.uint8))

    rgba = []
    for rgb, a in zip(stab_rgb, sm):
        rgb2, a2 = clean_alpha(rgb, a)
        rgba.append(np.dstack([rgb2, a2]))

    # bounding box da união do alpha
    union = np.max([x[..., 3] for x in rgba], 0)
    ys, xs = np.nonzero(union > 8)
    pad = 10
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(w, xs.max() + pad), min(h, ys.max() + pad)

    # registro na referência: onde o recorte fica no palco (px de referência)
    F, inl, ng, cc = register_to_ref(rgba[0][y0:y1, x0:x1, :3], rgba[0][y0:y1, x0:x1, 3],
                                     cfg["ref"], f"assets/processed/refmask-{version}.png")
    s = float(np.hypot(F[0, 0], F[1, 0]))
    rot = float(np.degrees(np.arctan2(F[1, 0], F[0, 0])))
    print(version, "registro → ref: escala %.4f rot %.2f° inliers %d/%d ecc %s" % (s, rot, inl, ng, cc), flush=True)
    cw, ch = x1 - x0, y1 - y0
    cx, cy = F @ np.array([cw / 2, ch / 2, 1.0])
    box = dict(x=round(cx - cw * s / 2, 1), y=round(cy - ch * s / 2, 1),
               w=round(cw * s, 1), h=round(ch * s, 1), rot=round(rot, 2))

    loop = make_loop(rgba, cfg["loop"], cfg.get("xfade", 0))
    out_w = cfg["out_w"] // 2 * 2
    out_h = round((y1 - y0) * out_w / (x1 - x0)) // 2 * 2
    fdir = os.path.join(work, "rgba")
    os.makedirs(fdir, exist_ok=True)
    for f in glob.glob(fdir + "/*.png"):
        os.remove(f)
    for i, fr in enumerate(loop):
        crop = fr[y0:y1, x0:x1]
        crop = cv2.resize(crop, (out_w, out_h), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(fdir, f"{i:04d}.png"), crop)

    # cabeça: topo do boné ~ centro do sujeito no frame 0 (para o balão)
    a0 = loop[0][y0:y1, x0:x1, 3]
    meta = dict(version=version, crop=[int(x0), int(y0), int(x1), int(y1)], out=[out_w, out_h],
                frames=len(loop), fps=cfg["fps"], box=box, ref_scale=s, ref_inliers=inl,
                ref_ecc=cc)
    with open(os.path.join(work, "meta.json"), "w") as fh:
        json.dump(meta, fh, indent=2)
    print(json.dumps(meta), flush=True)
    return meta, a0


def encode(version, work, fps, outdir="public/media"):
    src = os.path.join(work, "rgba", "%04d.png")
    webm = os.path.join(outdir, f"boneco-{version}.webm")
    mov = os.path.join(outdir, f"boneco-{version}.mov")
    crf = os.environ.get("VP9_CRF", "33")
    subprocess.run([FFMPEG, "-v", "error", "-y", "-framerate", str(fps), "-i", src,
                    "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", crf,
                    "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-auto-alt-ref", "0",
                    "-an", webm], check=True)
    subprocess.run([FFMPEG_HEVC, "-v", "error", "-y", "-framerate", str(fps), "-i", src,
                    "-c:v", "libx265", "-pix_fmt", "yuva420p", "-crf", os.environ.get("HEVC_CRF", "28"),
                    "-preset", "slow", "-tag:v", "hvc1", "-movflags", "+faststart", "-an", mov], check=True)
    # poster = frame 0 (garante que a troca poster → vídeo não "pula")
    poster = cv2.imread(os.path.join(work, "rgba", "0000.png"), cv2.IMREAD_UNCHANGED)
    cv2.imwrite(os.path.join(work, "poster.png"), poster)
    return webm, mov, poster


def glow_from(poster, path_png):
    """Extrai a linha de neon (ciano/verde brilhante) e borra num halo suave."""
    bgr, a = poster[..., :3], poster[..., 3]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    neon = ((hsv[..., 0] > 55) & (hsv[..., 0] < 100) & (hsv[..., 1] > 40) & (hsv[..., 2] > 170) & (a > 200))
    m = neon.astype(np.float32)
    g = cv2.GaussianBlur(m, (0, 0), 6) * 2.2 + cv2.GaussianBlur(m, (0, 0), 16) * 2.5
    g = np.clip(g, 0, 1)
    color = np.zeros_like(bgr)
    color[:] = (200, 255, 170)  # BGR: verde-água
    out = np.dstack([color, (g * 255).astype(np.uint8)])
    cv2.imwrite(path_png, out)


if __name__ == "__main__":
    version, frames_dir, mask_dirs, work = sys.argv[1], sys.argv[2], sys.argv[3].split(","), sys.argv[4]
    meta, _ = run(version, frames_dir, mask_dirs, work)
    webm, mov, poster = encode(version, work, CFG[version]["fps"])
    glow_from(poster, os.path.join(work, "glow.png"))
    for f in (webm, mov):
        print(f, os.path.getsize(f) // 1024, "KB")
