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

**Resultado: vídeo com alpha (plano A), sem plano B.** Lua + boneco animados
(digitando, mexendo os pés) com fundo transparente, nas duas versões.

| Versão | Origem | Saída | WebM VP9 α | HEVC α (.mov) | Loop |
|---|---|---|---|---|---|
| desktop | 1280×720, 24 fps, frames 1–97 | 900×826, 24 fps, 192 frames (8 s) | 2,1 MB | 1,2 MB | ping-pong |
| mobile | 1080×1920, 30 fps, 118 frames | 720×694, 30 fps, 110 frames (3,7 s) | 0,8 MB | 0,4 MB | crossfade de 8 frames |

Tudo abaixo de 3 MB por versão. Pipeline reproduzível em
`scripts/assets/video.py` (+ `finalize.mjs` para poster/glow).

### Segmentação
- `hyperframes remove-background` usa `u2net_human_seg` (modelo de pessoa).
  Testei u2net, isnet-general-use e BiRefNet-lite (rembg) em frames dos dois
  vídeos. Comparação em `docs/review/d1-xadrez-*.jpg`.
  - **Desktop:** BiRefNet-lite recorta lua + boneco inteiros e sólidos.
  - **Mobile:** nenhum modelo pegou a lua (escura sobre nuvens escuras).
    u2net e isnet a deixaram translúcida, BiRefNet a ignorou. Solução:
    **SAM** (rembg `sam`) com pontos positivos na lua e negativos no céu, unido
    à máscara BiRefNet do boneco.
- No CPU deste ambiente o BiRefNet levava ~50 s/frame. Rodei os modelos só em
  **keyframes (1 a cada 3)** e interpolei as máscaras intermediárias por
  optical flow bidirecional (Farneback), misturando pelo tempo.
- Limpeza do alpha: suavização temporal de 3 frames (anti-flicker), erode
  1 px, remoção de ilhas (só o componente principal + vizinhos a ≤25 px) e
  descontaminação de cor da franja (alpha < 150 pega a cor do pixel sólido
  mais próximo).
- Desktop: a câmera faz pan e, nos primeiros ~40 frames, um arco do fundo
  "encosta" na lua e entra na máscara. Correção: a região válida do sujeito
  vem dos frames ≥ 40 (presença ≥ 15%), com abertura morfológica para
  quebrar o "pescoço" entre arco e lua.

### Estabilização
SIFT só dentro do sujeito → similaridade de cada frame para o frame 0
(RANSAC), suavizada por média móvel de 5 frames, com warp por Lanczos. O "float"
é feito em código (GSAP). Parâmetros salvos em `stab_params.txt` no work dir.
Limite: a câmera do vídeo desktop orbita em 3D, então a lua muda levemente
de perspectiva ao longo do clipe. O ping-pong deixa isso suave e sem emenda.

### Loop sem emenda
- Desktop: ping-pong (0→96→1), emenda matematicamente nula
  (diferença 3,94 = passo normal 3,94).
- Mobile: crossfade de 8 frames. Diferença na emenda 4,06 contra 3,25 de
  um passo normal, ou seja, imperceptível. GIFs em `docs/review/d1-loop-*.gif`.

### Poster × vídeo (troca sem "pulo")
O prompt pedia o PNG limpo como poster. **Isso não é possível sem pulo:**
os PNGs `boneco-lua-*` são outra geração da cena (pose, proporção e lua
diferentes, ver `docs/review/d1-png-limpo-x-video.jpg`). O SIFT entre PNG e
vídeo não acha correspondência geométrica. Decisão: **o poster é o frame 0 do
próprio vídeo processado** (mesmo pipeline). Erro poster × frame 0
decodificado: RGB MAE 1,8/255, alpha MAE 0,05–0,08
(`docs/review/d1-poster-x-video-*.jpg`). A troca é invisível. Os PNGs
limpos (`assets/processed/boneco-lua-*.png`, franja removida por
`scripts/assets/defringe.py`) ficam como reserva para o plano B.

### Posição no palco
Registro do recorte na arte de referência: SIFT entre o sujeito do vídeo e
o boneco da ref (máscara BiRefNet da ref em `assets/processed/refmask-*.png`),
refinado por ECC afim. Gera `box` (x, y, w, h, rot) em px de referência,
gravado em `src/config/character.ts`. Mobile: ECC 0,65–0,95 (encaixe quase
perfeito). Desktop: ECC 0,61. O vídeo desktop tem outro enquadramento da
lua (mais larga), então prioriza-se o boneco (cabeça/tronco) sobre a lua.

### Codecs e Safari
- WebM VP9 com alpha: Chrome, Edge, Firefox, Android.
- HEVC com alpha (`.mov`, tag `hvc1`): Safari/iOS. O ffmpeg 6.1 do sistema
  não codifica alpha em HEVC, então usei o build estático do FFmpeg master
  (BtbN, x265 com `yuva420p`). Verificado que o arquivo decodifica com
  transparência. **Não testado num Safari real** (ambiente Linux): ver
  "pendências".
- Seleção do codec em JS (`pickCodec`): WebKit (Safari, qualquer navegador no
  iOS) recebe HEVC, os demais recebem WebM. Só a versão da orientação atual é
  baixada. O vídeo do dock só monta quando o dock aparece.
- Áudio removido (`-an`), `muted loop playsInline autoPlay`.

## 5. Título (D2)
`<h1>` em texto real: Montserrat 900 comprimida em X (`scale: 0.755 1`). As
duas palavras da ref batem com o mesmo fator, o que indica que a fonte da ref
é uma black mais estreita. Preenchimento = gradiente branco→transparente em
`background-blend-mode: screen` sobre o céu limpo
(`background-clip: text`), com a textura alinhada ao palco (efeito vidro).
Desktop: borda clara de 1 px + sombra suave. Mobile: contorno azul + glow
duplo, como na ref. Na ref mobile, "VIBE" é espaçado e deslocado à esquerda
(abre espaço para "Presença digital…"); isso foi reproduzido.

## 6. Pixel-match (`docs/review/`)
`scripts/review/compare.mjs` (pixelmatch + MAE por canal):

| Viewport | vs | pixelmatch | MAE |
|---|---|---|---|
| 1672×941 (tamanho da ref) | ref-desktop | 32,0% | 37,5 |
| 1440×810 | ref-desktop | 32,0% | 37,5 |
| 940×1672 (tamanho da ref) | ref-mobile | 28,9% | 34,9 |
| 390×844 | ref-mobile | 47,3% | 53,4 (proporção diferente, a ref é esticada) |

**Por que não zera:** as refs foram geradas à parte. As nuvens, os arcos e
o próprio boneco da ref não são os mesmos pixels de `bg-*-limpo` nem do
vídeo, então nenhum alinhamento leva o diff a "só antialiasing". Tudo o que é
nosso foi calibrado contra a ref: posição e tamanho de logo, menu, botão,
título, rótulos e boneco medidos (`scripts/review/measure.mjs`), mais o
grading do céu (saturação +14%, contraste +7%, embutido nas imagens) e a
vinheta. Lado a lado em `desktop-lado-a-lado.jpg` / `mobile-lado-a-lado.jpg`.

## 7. Responsividade
- Unidades: `--ux/--uy` (eixos da viewport), `--un` (contain) e `--uc` (cover).
  O céu usa o palco **cover** com ponto focal. O boneco usa um palco
  **contain** próprio (nunca corta lua ou pés em 4:3, 21:9 ou tablet
  retrato). A UI fica nas posições da ref, com piso de tamanho.
- Retrato = layout mobile, paisagem = desktop (tablets inclusos).
- Elementos da direita (CTA, tagline, scroll) ancorados pela direita.
- Hambúrguer abaixo de 375 px em retrato (a linha de links não cabe).
- Folhas de contato: `docs/review/tamanhos-*.jpg` (360 → 2560).

## 8. Performance e qualidade
- Lighthouse mobile (mediana de 3): **Performance 87**, Acessibilidade
  **100**, Boas práticas 96, SEO **100**, CLS **0**. Desktop: 99/100/100/100.
  Relatórios HTML em `docs/review/lighthouse-*.html`.
- LCP mobile ~4 s: o loader obrigatório + a revelação do título por clip
  seguram o LCP sob o throttling 4× do Lighthouse. Céu, horizonte e nuvens
  ficam opacos desde o primeiro paint justamente para não piorar isso.
- Boas práticas 96: a auditoria `font-size` reprova rótulos de 10 px
  (piso escolhido para manter a proporção da ref nos celulares).
- Long tasks em animação: o filter CSS no céu gerava long tasks durante o
  parallax. O grading foi embutido nas imagens e as partículas passaram a
  usar sprite pré-renderizado: **0 long tasks no parallax**. Restam 2 tasks de
  ~61 ms no início da transição de volta (re-render do React + play do
  vídeo). `scripts/review/perf.mjs` mede isso.
- **FPS não é medível de forma confiável aqui:** o Chromium headless deste
  container não tem GPU (raster/composição em software), então mostra 15–35
  fps em qualquer animação, inclusive com tudo desligado (30 fps).
  Recomendo um trace no Chrome DevTools de uma máquina real (ver HANDOFF).

## 9. Revisão adversarial (corrigido)
1. O loader pré-carregava o WebP do céu enquanto o `<picture>` baixava o
   AVIF (download duplicado de 131–438 KB). Agora ele aguarda as `<img>`
   reais do DOM.
2. O vídeo do boneco era baixado duas vezes (hero + dock escondido). Agora
   o dock só monta o vídeo quando aparece.
3. Após navegar pelo teclado, a seção recebia foco programático com
   contorno visível na tela inteira. O contorno foi removido só nas seções.
4. Balão: uma animação de fechamento podia remover um balão recém-aberto
   (corrida). Além disso, o balão ficava flutuando sobre a seção 2. Agora o
   fechamento só remove o próprio balão e a troca de seção fecha o balão.
5. Teclado durante o cooldown pós-transição era ignorado. O cooldown agora
   vale só para wheel/touch (inércia do trackpad).

Refutado: `preventDefault` do GSAP Observer não bloqueia toques/cliques. Ele
só atua em drag/wheel, nunca no press.

## 10. Desvios conscientes do prompt
- Poster = frame 0 do vídeo, não o PNG (ver D1).
- Vinheta abaixo da UI (contraste dos rótulos).
- Desktop: "scroll para explorar" com linha animada (como na ref), sem ícone
  de mouse. O ícone de mouse aparece no mobile, como na ref mobile.
- Ponto final de "propósito." e "reais." some no mobile (como na ref
  mobile).
- O balão usa a frase extra "Ideia boa parada no papel não gera venda
  nenhuma." (5 falas + CTA). A fala 3 virou "Você cuida do negócio. O código
  fica comigo. 😎". Aguarda aprovação do copy.
