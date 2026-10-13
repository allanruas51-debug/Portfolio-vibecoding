# Handoff

> Gerado: 2026-10-13
> Projeto: Portfolio-vibecoding (branch `ccr-007f1615-dz131t`)
> Resumo: a hero "ALLAN RUAS / VIBE CODING" foi construída de ponta a ponta
> (Next.js 16 + Tailwind v4 + GSAP), com boneco animado com alpha, fullpage e
> uma seção 2 placeholder. As próximas seções entram por cima dessa base.

## Objetivo

Portfólio do Allan Ruas, uma tela por vez (fullpage). A hero está pronta e
calibrada contra `assets/source/ref-desktop.png` e `ref-mobile.png`. O próximo
passo é criar as seções reais (Projetos, Serviços, Sobre, Koda Dev, Contato) no
mesmo controlador, mantendo a estética (céu, glass escuro, neon verde-água,
Urbanist + Montserrat 900).

## Estado atual

**Funcionando (com prova em `docs/review/`):**
- Hero completa: céu em camadas, `<h1>` real com textura, lua + boneco em
  vídeo com alpha (WebM VP9 / HEVC), nuvens da frente, partículas, vinheta,
  UI em HTML, loader, entrada coreografada, parallax (mouse, giroscópio,
  arrasto), balão de fala, transição "câmera entrando nas nuvens" de ida e
  volta, dock do boneco nas outras seções e reduced-motion.
- 18 testes Playwright verdes (`npx playwright test`).
- Lighthouse mobile ~87/100/96/100, desktop 99/100/100/100, CLS 0.

**Pendente / não verificado:**
- HEVC com alpha **não foi testado num Safari/iPhone real** (o ambiente é
  Linux). Se aparecer fundo preto no Safari, o plano é um MP4 H.264
  "stacked alpha" (RGB em cima, alpha embaixo) composto em `<canvas>`/WebGL.
- FPS real: o headless sem GPU não mede FPS de verdade. Falta um trace no
  Chrome DevTools numa máquina com GPU durante o parallax e a transição.
- O número do WhatsApp (`WHATSAPP_NUMBER = "55XXXXXXXXXXX"`) e os links do
  menu (`#servicos`, `#sobre` etc. ainda não têm seção) dependem do Allan.

## Arquivos-chave

| Arquivo | Por que importa |
|---|---|
| `src/config/site.ts` | textos, menu, falas do balão, WhatsApp e lista de seções |
| `src/config/character.ts` | box do boneco no palco (gerado pelo pipeline) + mídias |
| `src/components/Experience.tsx` | **array `SECTIONS`**: nova seção = novo componente + 1 linha |
| `src/components/Section.tsx` | contrato `SectionTransition { enter, leave }` e wrapper `<Section>` |
| `src/components/FullpageController.tsx` | Observer (wheel/touch), teclado, links `#id`, timeline única |
| `src/components/ProjectsPlaceholder.tsx` | exemplo mínimo de seção (substituir pela real) |
| `src/components/HeroScene.tsx` | camadas, entrada, transições da hero |
| `src/components/CharacterScene.tsx` | poster → vídeo, escolha de codec, botão acessível |
| `src/components/CharacterDock.tsx` | boneco no canto das outras seções |
| `src/components/SpeechBubble.tsx` | balão (pop, typewriter, timer, CTA a cada 4) |
| `src/components/useParallax.ts` | parallax mouse/giroscópio/arrasto |
| `src/app/globals.css` | tokens `@theme`, unidades `--ux/--uy/--un/--uc`, posições medidas |
| `scripts/assets/video.py` | pipeline D1 (máscaras → interpolação → estabilização → loop → encode) |
| `scripts/review/*.mjs` | screenshot, medida, diff com a ref, sequência, perf |
| `docs/DECISOES.md` | todas as decisões e números |

## O que foi tentado e não funcionou (não repita)

1. **`remove-background` / u2net / isnet no vídeo mobile:** lua translúcida ou
   ausente. Funciona: SAM com pontos na lua + BiRefNet no boneco.
2. **BiRefNet em todos os frames:** ~50 s/frame e ~12 GB de RAM; três
   processos em paralelo morreram por OOM. Funciona: keyframes 1/3 + optical
   flow, rodando **um processo por vez**.
3. **PNG limpo como poster:** os PNGs são outra geração da cena e não
   coincidem com o vídeo. Poster = frame 0 do vídeo.
4. **Registrar o vídeo na ref por SIFT na imagem inteira:** pega o fundo, não o
   boneco. Funciona: SIFT restrito ao boneco da ref + ECC afim.
5. **`filter` CSS no céu (grading):** gerava long tasks no parallax. O grading
   está embutido nas imagens (`scripts/assets/images.mjs`).
6. **`position: relative`/`transform` numa palavra do título:** ela sai do
   `background-clip: text` do pai e vira contorno vazio. Use margin.
7. **`pkill -f "next dev"` no shell:** casa com o próprio comando e mata o
   shell (exit 144). Reinicie o servidor por um script separado.

## Próximos passos

1. Validar no Safari (macOS e iOS): o vídeo HEVC com alpha deve ficar
   transparente. Se não ficar, implementar o fallback stacked-alpha.
2. Trace de performance no Chrome DevTools (máquina com GPU): parallax +
   ida/volta, sem long tasks > 50 ms. As 2 tasks de ~61 ms no início da volta
   vêm do re-render do React + play do vídeo. Se aparecerem no trace,
   memoizar as seções (`register` estável por índice no controlador).
3. Criar as seções reais. Para cada uma: componente em `src/components/`
   que recebe `SectionProps`, chama `register({ enter, leave })` (ver
   `ProjectsPlaceholder.tsx`), envolve o conteúdo em `<Section>` e entra no
   array `SECTIONS` de `Experience.tsx` com o `id` igual ao `href` do menu.
4. Trocar `WHATSAPP_NUMBER` e revisar as falas do balão em `site.ts`.
5. Ajustar `site.url` (canonical/OG/JSON-LD) para o domínio real.

## Restrições

- Não redesenhar nem gerar imagens novas. Só limpeza/recorte/conversão por
  script, registrada em `docs/DECISOES.md`.
- GSAP é a única engine de animação (nada de Framer Motion). Fullpage por
  GSAP Observer (nada de Lenis).
- Animar só `transform`/`opacity`. Nada de `filter` em camadas que se movem.
- Nada é "pronto" sem prova (screenshot, diff, Lighthouse ou teste).
- Next.js 16: leia `node_modules/next/dist/docs/` antes de usar APIs novas
  (ver `AGENTS.md`).

## Como rodar e reproduzir

```bash
npm install && npm run dev          # http://localhost:3000
npm run build && npx next start -p 3100
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test
```

Pipeline de assets (Python 3 com `rembg[cpu]`, `opencv-python-headless`; FFmpeg
com x265 `yuva420p` para HEVC alpha em `FFMPEG_HEVC`):

```bash
python scripts/assets/defringe.py assets/source/boneco-lua-1.png assets/processed/boneco-lua-1.png
node scripts/assets/images.mjs           # céu AVIF/WebP com grading
python scripts/assets/fgmask.py          # máscaras das nuvens da frente
python scripts/assets/video.py desktop <frames> <mascaras> <work>   # ver docstring
node scripts/assets/finalize.mjs <work_desktop> <work_mobile>
```
