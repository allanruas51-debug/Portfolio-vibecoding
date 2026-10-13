import { Experience } from "@/components/Experience";
import { hero, site } from "@/config/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: site.jobTitle,
  description: site.description,
  image: `${site.url}/opengraph-image.jpg`,
  knowsAbout: ["Desenvolvimento web", "Front-end", "Landing pages", "Presença digital", "Vibe coding"],
  sameAs: site.sameAs,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Experience />
      <noscript>
        <style>{`.loader{display:none}`}</style>
        <p style={{ position: "fixed", bottom: 16, left: 16, zIndex: 200 }}>
          {hero.title.join(" ")} — {site.description}
        </p>
      </noscript>
    </>
  );
}
