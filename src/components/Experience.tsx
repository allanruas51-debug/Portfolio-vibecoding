"use client";

import { CharacterDock } from "./CharacterDock";
import { ExperienceProvider } from "./ExperienceProvider";
import { FullpageController } from "./FullpageController";
import { HeroScene } from "./HeroScene";
import { Loader } from "./Loader";
import { ProjectsPlaceholder } from "./ProjectsPlaceholder";
import type { SectionDefinition } from "./Section";
import { SpeechBubble } from "./SpeechBubble";

/** Ordem das seções do fullpage. Nova seção = novo componente + uma linha aqui. */
const SECTIONS: SectionDefinition[] = [
  { id: "hero", label: "Início", Component: HeroScene },
  { id: "projetos", label: "Projetos", Component: ProjectsPlaceholder },
];

export function Experience() {
  return (
    <ExperienceProvider>
      <FullpageController sections={SECTIONS} />
      <CharacterDock />
      <SpeechBubble />
      <Loader />
    </ExperienceProvider>
  );
}
