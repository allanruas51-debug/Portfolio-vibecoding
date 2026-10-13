# Allan Ruas — Vibe Coding

Portfólio fullpage do Allan Ruas. Esta versão traz a **hero** completa e uma
seção 2 placeholder para validar a navegação.

- Next.js 16 (App Router) · TypeScript · Tailwind v4 · GSAP (Observer)
- Boneco animado com fundo transparente: WebM VP9 alpha (Chrome/Firefox/Android)
  e HEVC alpha (Safari/iOS)

```bash
npm install
npm run dev      # http://localhost:3000
```

Conteúdo editável (textos, menu, falas do balão, WhatsApp) em
`src/config/site.ts`.

- Decisões técnicas e números: [`docs/DECISOES.md`](docs/DECISOES.md)
- Comparações com as refs, Lighthouse e GIFs: [`docs/review/`](docs/review/)
- Como continuar (próximas seções): [`HANDOFF.md`](HANDOFF.md)

Testes: `npx playwright test` (desktop 1440×810 e Pixel 7 390×844).
