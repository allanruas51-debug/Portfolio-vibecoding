/**
 * Configuração central do site. Textos, links, frases do balão e contato
 * vivem aqui para que o conteúdo mude sem mexer nos componentes.
 */

/** Número no formato internacional, só dígitos (ex.: 5511999999999). */
export const WHATSAPP_NUMBER = "55XXXXXXXXXXX";
export const WHATSAPP_MESSAGE =
  "Oi, Allan! Vi seu portfólio e quero tirar uma ideia do papel.";

export const whatsappUrl = (message: string = WHATSAPP_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const site = {
  name: "Allan Ruas",
  url: "https://allanruas.com.br",
  title: "Allan Ruas — Vibe Coding | Presença digital com propósito",
  description:
    "Allan Ruas cria sites, landing pages e experiências digitais que tiram ideias do papel e transformam presença online em negócio.",
  locale: "pt_BR",
  jobTitle: "Desenvolvedor Front-end e Designer de Experiências Digitais",
  sameAs: [] as string[],
};

export type NavLink = { label: string; href: string };

export const nav: NavLink[] = [
  { label: "Projetos", href: "#projetos" },
  { label: "Serviços", href: "#servicos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Koda Dev", href: "#koda-dev" },
  { label: "Contato", href: "#contato" },
];

export const hero = {
  title: ["Vibe", "Coding"] as const,
  cta: "Falar com a gente",
  tagline: ["Presença", "digital", "com", "propósito."],
  pillars: ["Ideias", "Negócios", "Experiências", "Reais."],
  scroll: ["Scroll", "para", "explorar"],
  characterLabel: "Allan Ruas em versão boneco, digitando no notebook. Toque para ouvir o que ele tem a dizer.",
};

/**
 * Falas do balão. Sorteadas sem repetir a anterior; a cada `ctaEvery`
 * cliques entra a fala de CTA, que mostra o botão do WhatsApp.
 */
export const speech = {
  lines: [
    "Bora tirar sua ideia do papel? 🚀",
    "Site bonito é fácil. Site que vende é outra conversa.",
    "Você cuida do negócio. O código fica comigo. 😎",
    "Tô digitando seu próximo projeto… só falta você chamar.",
    "Ideia boa parada no papel não gera venda nenhuma.",
  ],
  cta: {
    text: "Chega de só olhar. Bora conversar?",
    button: "Falar com a gente",
  },
  ctaEvery: 4,
  /** Tempo (ms) até o balão sumir sozinho. Pausa com o mouse em cima. */
  autoHideMs: 4000,
};

/** Seções do fullpage, na ordem. A hero é sempre a primeira. */
export const sections = [
  { id: "hero", label: "Início" },
  { id: "projetos", label: "Projetos" },
] as const;
