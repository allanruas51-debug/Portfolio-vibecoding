# Decisões — Hero "ALLAN RUAS / VIBE CODING"

Registro das decisões tomadas de forma autônoma durante a construção da hero.
Toda imagem citada em `docs/review/` é prova da decisão correspondente.

## 1. Mapeamento dos assets

Os arquivos chegaram como uploads com nomes genéricos. Cada um foi aberto,
identificado pelo conteúdo e copiado com o nome padrão para `assets/source/`.
Os originais intactos ficam em `assets/originals/`.

| Nome padrão | Arquivo original | Como foi reconhecido |
|---|---|---|
| `ref-desktop.png` | `9d92b30d-image.png` (1672×941) | design final paisagem, UI completa, boneco "07" |
| `ref-mobile.png` | `464d1c89-image.png` (940×1672) | design final retrato, título em 2 linhas, boneco "037" |
| `bg-desktop-lua.png` | `59f3eb50-image.png` (1672×941) | céu + lua metálica, sem boneco/texto |
| `bg-desktop-limpo.jpg` | `5855e6bd-image.jpg` (1536×864) | mesmo céu, sem a lua |
| `bg-mobile-lua.png` | `be1762dd-image.png` (940×1672) | céu retrato + lua |
| `bg-mobile-limpo.png` | `2bba0d20-image.png` (940×1672) | céu retrato sem a lua |
| `boneco-lua-1.png` | `7091e259-image.png` (1254×1254, alpha) | boneco + lua, moletom "07" → desktop |
| `boneco-lua-2.png` | `905d915f-image.png` (1359×1157, alpha) | boneco + lua, moletom "037" → mobile |
| `texto-desktop.png` | `6a925585-image.png` (1672×941, alpha) | texto desktop com halo cinza |
| `texto-mobile.png` | `44b5fcf1-image.png` (1024×1536, alpha) | texto mobile com glow azul |
| `boneco-animacao-desktop.mp4` | `a0a9895b-…mp4` | 1280×720, 24 fps, 8 s, com áudio |
| `boneco-animacao-mobile.mp4` | `013c5c32-…mp4` | 1080×1920, 30 fps, 3,93 s, com áudio |

> Observação: na primeira passada `ref-mobile` e `bg-mobile-limpo` foram
> trocados (ambos 940×1672). O erro apareceu ao recortar a ref e foi corrigido
> antes de qualquer uso.

**Os assets não são pixel-alinhados entre si.** Registro por SIFT mostrou que
os recortes `boneco-lua-*.png` não coincidem com o boneco das refs nem com o
dos vídeos (são gerações diferentes da mesma cena). Isso pesou no D1 (abaixo).

## 2. Tipografia

- Título "VIBE CODING": sans geométrica black, caixa alta, C/O circulares,
  G com esporão. A mais próxima no Google Fonts é **Montserrat 900**
  (alternativas avaliadas: Archivo Black, que é condensada demais, e
  Unbounded, larga demais e com terminais arredondados).
- Logo, menu e textos de canto: a mesma **Montserrat** (600 no logo, 500 nos
  rótulos), caixa alta, tracking largo. Uma família só, variável, carregada
  por `next/font` (self-hosted, `display: swap`).
- Tamanhos de UI têm piso (`max(10px, …)`) para continuarem legíveis no
  celular. Na arte mobile o menu tem ~7 px reais num iPhone, o que é ilegível.

## 3. Mapa de camadas

Do fundo para a frente. `data-depth` define o fator do parallax.

| # | Camada | Origem | depth |
|---|---|---|---|
| 1 | Céu | `bg-*-limpo` (AVIF/WebP, `srcset`) | 0.15 |
| 2 | Horizonte + raios de sol | o mesmo céu com máscara de faixa + gradiente cônico em `screen` | 0.35 |
| 3 | Título `<h1>` | texto real, `background-clip: text` com o céu como textura | 0.6 (tilt 3°) |
| 4 | Lua + boneco | vídeo com alpha (D1), poster = frame 0 | 0.9 (tilt 6°) |
| 5 | Nuvens da frente | o mesmo céu com máscara gerada (`scripts/assets/fgmask.py`) | 1.25 |
| 6 | Partículas | canvas, 36 partículas | 1.1 |
| 7 | Vinheta/grading | gradientes CSS | — |
| 8 | UI | HTML (logo, menu, botão, textos, scroll) | — |

A vinheta fica **abaixo** da UI (o prompt a lista por cima). Com ela por
cima, os textos brancos dos cantos perdem contraste. Nas refs eles são
nítidos.

## 4. D1 — Boneco animado com fundo transparente

_(preenchido na seção 5)_
