# PROMPT PARA O CLAUDE CODE — HERO "ALLAN RUAS / VIBE CODING"

## 0. MISSÃO
Você é um engenheiro front-end sênior com olho de diretor de arte e motion designer. Construa, do zero e de ponta a ponta, a HERO (1 tela) do meu portfólio "ALLAN RUAS", já com a arquitetura pronta para próximas seções e uma segunda seção placeholder para validar a transição.

Trabalhe de forma **autônoma**: resolva sozinho os problemas dos assets descritos abaixo, decida pelos planos B quando necessário e documente cada decisão em `docs/DECISOES.md`. Só me interrompa se algo for realmente impossível de resolver com os arquivos disponíveis.

Prioridades, nesta ordem: 1) fidelidade visual às referências, 2) performance, 3) todo o resto. Nada de "aproximado": tudo é validado com screenshot e diff.

## 1. SKILLS: QUAIS USAR E QUANDO
Carregue cada skill **na fase indicada** e siga as instruções dela.

| Fase | Skill | Para quê |
|---|---|---|
| Análise | `anthropic-skills:frontend-design`, `anthropic-skills:impeccable` | Leitura crítica das refs, hierarquia e camadas |
| Análise | `anthropic-skills:better-typography` | Identificar a fonte do título/menu e escolher a mais próxima no Google Fonts |
| Assets | `anthropic-skills:hyperframes-media` | `remove-background` nos vídeos (boneco com alpha) |
| Setup | `anthropic-skills:vercel-react-best-practices`, `anthropic-skills:tailwind-v4` | Next.js App Router e Tailwind v4 com tokens em `@theme` |
| Visual | `anthropic-skills:glass-dark-ui`, `anthropic-skills:css-border-gradient`, `anthropic-skills:beam-glow-states` | Botão pill, glow neon, estados de hover |
| Motion | `anthropic-skills:gsap`, `anthropic-skills:gsap-scrolltrigger` | Timeline de entrada, fullpage, parallax |
| Motion | `anthropic-skills:ui-animation`, `anthropic-skills:emil-design-eng` | Balão de fala, magnetic hover, easings e durações |
| Motion | `anthropic-skills:animation-performance` | 60fps, só `transform`/`opacity` |
| Copy | `anthropic-skills:copywriting` | Refinar as frases do balão |
| Qualidade | `anthropic-skills:better-accessibility`, `anthropic-skills:web-design-guidelines` | Foco, teclado, alt, reduced-motion, contraste |
| Qualidade | `anthropic-skills:seo-audit`, `anthropic-skills:schema-markup` | Metadados, Open Graph, JSON-LD `Person` |
| Verificação | `anthropic-skills:chrome-devtools` | Screenshots, Lighthouse, trace de performance |
| Revisão | `anthropic-skills:adversarial-review` | Revisão final hostil do código, corrigindo o que for real |
| Fim | `anthropic-skills:handoff` | `HANDOFF.md` para continuarmos nas próximas seções |

## 2. ASSETS — IDENTIFIQUE E PREPARE SOZINHO
Os arquivos estão em `/assets` (se não estiverem, procure no projeto e nos uploads). **Os nomes podem não bater com os daqui**: identifique cada arquivo abrindo e olhando o conteúdo, renomeie para os nomes abaixo dentro de `assets/source/` (sem apagar os originais) e registre o mapeamento em `docs/DECISOES.md`.

| Nome padrão | Como reconhecer |
|---|---|
| `ref-desktop.png` | Design final desktop, paisagem, com UI completa e boneco "07" |
| `ref-mobile.png` | Design final mobile, retrato, título em 2 linhas, boneco "037" |
| `bg-desktop-lua` / `bg-mobile-lua` | Céu com lua metálica, sem boneco e sem texto |
| `bg-desktop-limpo` / `bg-mobile-limpo` | Mesmo céu sem a lua |
| `boneco-lua-1.png` | Boneco + lua em fundo transparente, moletom "07" → usar no desktop |
| `boneco-lua-2.png` | Boneco + lua em fundo transparente, moletom "037" → usar no mobile |
| `texto-desktop.png` | Texto do design desktop em fundo preto/transparente com halo cinza |
| `texto-mobile.png` | Texto do design mobile com glow azul sobre fundo preto |
| `boneco-animacao-desktop.mp4` | 1280×720, 24fps, 8s |
| `boneco-animacao-mobile.mp4` | 1080×1920, 30fps, ~3,9s |

### 2.1 Problemas conhecidos e o que fazer (sem me perguntar)
1. **Franja dourada nos recortes `boneco-lua-*.png`**: limpe com defringe/erosão de 1–2 px no canal alpha (sharp ou ImageMagick). Não altere o conteúdo.
2. **Textos em PNG com halo sujo**: não use como camada final. O título vira texto HTML (seção 3, item D2). Use os PNGs só como gabarito de posição/tamanho (overlay a 50% de opacidade durante o desenvolvimento).
3. **Os vídeos são a cena inteira**, não o boneco isolado: têm céu, UI, áudio e nenhum alpha. O mobile tem um "ALLAN RUAS" extra no canto e um arco no topo; o desktop não tem o título, tem movimento de câmera e baixa resolução. Use-os **apenas como fonte do movimento do boneco** (seção 3, item D1).

## 3. DECISÕES TÉCNICAS
**D1 — Boneco animado com fundo transparente**
1. Rode `remove-background` (skill `hyperframes-media`) para isolar boneco + lua em cada vídeo. Avalie bordas, flicker do alpha e se a lua saiu inteira. Se o resultado for ruim, tente outro modelo (rembg/BiRefNet em Python) e fique com o melhor.
2. Desktop: estabilize o boneco (o vídeo tem câmera móvel). Faça tracking do bounding box e crop + estabilização (ffmpeg `vidstab` ou transformação por frame) para que ele fique fixo. O "float" é feito em código.
3. Escale e posicione o vídeo para coincidir **exatamente** com o `boneco-lua-*.png` limpo da mesma versão (sobreponha e compare), para que a troca poster → vídeo não "pule".
4. Remova o áudio. Garanta loop sem emenda: compare o último com o primeiro frame. Se pular, faça crossfade de ~6 frames ou ping-pong.
5. Exporte: WebM VP9 com alpha (Chrome/Firefox/Android) + HEVC com alpha `.mov` (Safari/iOS) + poster = PNG limpo. Atributos `autoplay muted loop playsInline`. Meta: ≤ 3 MB por versão.
6. **Plano B automático**: se, mesmo com os dois modelos, o alpha tremer ou as bordas ficarem visivelmente piores que o PNG, use o PNG estático limpo como boneco e anime só mãos e pés com recortes do vídeo em máscaras pequenas. Se nem isso ficar bom, use PNG estático + float + neon pulsando. Registre a escolha e o motivo em `docs/DECISOES.md`, com imagens de comparação em `docs/review/`.

**D2 — Título "VIBE CODING"**: `<h1>` em texto real, com a textura de nuvens via `background-clip: text` usando o `bg-*-limpo` como textura, + borda/glow azul e sombra suave em CSS, calibrados até bater com a ref. Fonte: a que você identificar com `better-typography` (sans geométrica black). Só se for impossível igualar em HTML, use o PNG limpo e registre.

**D3 — Menu, botão e textos de canto**: HTML real, medidos contra as refs.

**D4 — Stack**: Next.js (App Router) + TypeScript + Tailwind v4 + GSAP (core, ScrollTrigger, Observer). Para o fullpage use **GSAP Observer** (wheel/touch/teclado), não Lenis, porque Lenis atrapalha a navegação de uma seção por vez. Não use Framer Motion, para não ter duas engines de animação.

## 4. LAYOUT E CAMADAS (idêntico às refs)
Do fundo para a frente, cada camada com profundidade própria de parallax:
1. Céu (`bg-*-limpo`), com zoom/drift lento.
2. Nuvens e arcos (recortes/máscaras do próprio bg) + raios de sol pulsando de leve.
3. Título "VIBE CODING".
4. Lua + boneco (D1), sobrepondo o título como na ref.
5. Nuvens de primeiro plano cobrindo parte da lua e dos pés (máscara recortada do `bg-*-lua`).
6. Partículas de luz discretas (canvas leve, ≤ 40 partículas).
7. UI: logo, menu, botão, textos de canto, indicador de scroll.
8. Vinheta + grading azul/dourado em overlay CSS, para casar com o contraste da ref.

**Desktop**: "ALLAN RUAS" à esquerda (branco, tracking bem largo), menu centralizado (PROJETOS, SERVIÇOS, SOBRE, KODA DEV, CONTATO — caixa alta, fonte fina, tracking largo, azul-claro/branco translúcido), botão pill "→ FALAR COM A GENTE" com borda e brilho no canto superior direito, título em 1 linha atrás do boneco, "PRESENÇA DIGITAL COM PROPÓSITO" à direita do título com traço fino, "IDEIAS / NEGÓCIOS / EXPERIÊNCIAS / REAIS" no canto inferior esquerdo com traço, "SCROLL PARA EXPLORAR" com ícone de mouse no canto inferior direito.

**Mobile**: logo centralizado no topo, menu em linha abaixo (se não couber em 360px, vira hambúrguer animado na mesma estética), botão centralizado abaixo do menu, título em 2 linhas (VIBE / CODING) com "PRESENÇA DIGITAL COM PROPÓSITO" ao lado, boneco "037" abaixo do título, textos de canto embaixo.

## 5. ANIMAÇÃO E INTERAÇÃO
**Boneco**: loop contínuo digitando e mexendo os pés durante toda a navegação. Float suave da lua+boneco juntos (±6px, ~5s, sine). Respiração do neon verde (~3s). Vídeo desktop no desktop e mobile no mobile, trocando por `matchMedia` e carregando só o necessário.

**Parallax 3D**: segue o mouse (desktop), o giroscópio (mobile; no iOS pede permissão só após o primeiro toque) ou o arrasto. Inclinação máx. ~6°, cada camada com fator diferente, suavizado com `gsap.quickTo`.

**Hover no boneco**: cursor customizado, neon mais forte, escala 1.03.

**Clique/toque no boneco → balão de fala (como se eu estivesse falando)**:
- Entrada: scale com spring e leve overshoot ("pop") + fade, cauda apontando para a cabeça do boneco, texto em typewriter. Some sozinho após ~4s; o timer pausa com o mouse em cima.
- Gesto extra: a "cabeça levanta" rápido (tilt/translate de ~300ms no boneco), sem parar a digitação.
- Frases em rotação aleatória, nunca repetindo a anterior. A cada 4 cliques vem a frase de CTA. Refine o copy com `copywriting`, mantendo o tom descontraído, direto e vendedor. Ponto de partida:
  1. "Bora tirar sua ideia do papel? 🚀"
  2. "Site bonito é fácil. Site que vende é outra conversa."
  3. "Você cuida do negócio, eu cuido do código. 😎"
  4. "Tô digitando seu próximo projeto… só falta você chamar."
  5. (CTA) "Chega de só olhar. Bora conversar?" + botão **Falar com a gente** → WhatsApp.
- Mobile: área de toque ≥ 44px, balão sempre dentro da viewport (clamp de posição + safe-area), fecha com toque fora ou `Esc`.
- Acessível: o boneco é um `<button>` com `aria-label`, e o balão usa `aria-live="polite"`.

**Entrada (page load)**: loader rápido e elegante com progresso real dos assets críticos (máx. ~1,5s; se passar disso, entra com o poster). Coreografia: céu com fade + zoom-out → nuvens entram → título revela por máscara/clip → boneco sobe flutuando → menu e textos em stagger.

**Micro-interações**: underline animado + glow no menu; botão pill com glow e seta deslizando; magnetic hover no botão (só com ponteiro fino).

**Transição fullpage**: wheel, trackpad (com threshold/debounce para não pular duas seções), swipe e teclado (↓, PageDown, Espaço, e ↑ para voltar). A hero sai com "câmera entrando nas nuvens": zoom nas camadas em velocidades diferentes, título se afasta e desfoca, nuvens da frente cobrem a tela, fade para a seção 2. A seção 2 é um placeholder simples para validar ida e volta. O boneco continua vivo (migra para um canto ou reaparece na seção 2). "SCROLL PARA EXPLORAR" anima (mouse/seta subindo e descendo) e some ao sair da hero. Arquitetura: array de seções + um controlador único de transição, para eu adicionar seções depois só criando componentes.

**prefers-reduced-motion**: sem parallax, partículas nem zoom; transições viram fade curto; o boneco continua em loop, sem float.

## 6. RESPONSIVIDADE
- Testar em 360, 390, 430, 768, 1024, 1280, 1440, 1920 e 2560px de largura.
- Layout escolhido pela orientação: retrato → design mobile, paisagem → design desktop (tablet segue a mesma regra).
- `100dvh`, `env(safe-area-inset-*)`, zero scroll horizontal.
- Enquadramento por ponto focal: `object-position` calculado para manter boneco, lua e sol nos mesmos lugares da ref em qualquer proporção. Nada de só "esticar".

## 7. QUALIDADE (critérios de aceite)
- Imagens em AVIF/WebP com `srcset` (até 2× para 2560px); bg e boneco da hero com prioridade, o resto lazy.
- Lighthouse mobile: Performance ≥ 85, Acessibilidade ≥ 95, SEO 100, CLS < 0,05.
- 60fps no trace do Chrome durante parallax e transição, sem long tasks > 50ms em animação.
- SEO: title, description, Open Graph (imagem OG gerada a partir da ref desktop), favicon, JSON-LD `Person`.
- Acessibilidade: foco visível, ordem de tab lógica, alt em tudo, contraste do menu sobre o céu verificado.
- Componentes: `Loader`, `Navbar`, `MobileMenu`, `HeroScene`, `SkyLayers`, `CharacterScene`, `SpeechBubble`, `ScrollIndicator`, `FullpageController`, `Section`.
- Tudo configurável em `config/site.ts`: textos, frases do balão, links do menu, `WHATSAPP_NUMBER = "55XXXXXXXXXXX"` e mensagem padrão do WhatsApp.

## 8. ORDEM DE EXECUÇÃO (faça tudo, sem pular etapas)
Use uma lista de tarefas e marque cada etapa ao concluir.
1. **Análise**: identifique e mapeie os assets (seção 2), escolha a fonte e escreva o mapa de camadas em `docs/DECISOES.md`.
2. **Assets**: limpe os PNGs e processe os vídeos (D1), salvando comparações em `docs/review/` (frame sobre fundo xadrez, GIF do loop, sobreposição vídeo × PNG).
3. **Setup** do projeto e **montagem estática** desktop e mobile, sem animação. Rode `npm run dev`.
4. **Pixel-match**: screenshots com Playwright em 1440×810 (vs `ref-desktop.png`) e 390×844 (vs `ref-mobile.png`), diff com pixelmatch e imagem lado a lado. Corrija posição, tamanho, luz, contraste e sobreposição até a diferença ser só de antialiasing/textura. Salve as comparações finais em `docs/review/`.
5. **Animações e interações** (seção 5).
6. **Testes** com Playwright onde der: loop do boneco sem emenda, parallax mouse/toque, balão (cliques repetidos, toque, bordas da tela), transição ida e volta (wheel, swipe, teclado), reduced-motion e todos os tamanhos da seção 6.
7. **Lighthouse + trace** com `chrome-devtools`, corrigindo até bater os critérios da seção 7.
8. **Revisão** com `adversarial-review` e correção do que for real.
9. **Entrega**: `HANDOFF.md` (skill `handoff`) + resumo final com: o que foi feito, decisões tomadas (especialmente o resultado do D1), como rodar (`npm install && npm run dev`), as comparações finais com as refs e o que depende de mim (número do WhatsApp, links do menu, aprovação do copy).

## 9. LIMITES
- Não redesenhe, não recrie com CSS/SVG e não gere imagens novas no lugar dos assets. Exceções: título em texto real (D2) e UI em HTML (D3). Limpeza, recortes e conversões por script são permitidos e devem ser registrados.
- Não declare nada como pronto sem a prova correspondente (screenshot, diff, relatório Lighthouse ou teste).
