import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Faq } from "./_components/faq";
import { Features } from "./_components/features";
import { FinalCta } from "./_components/final-cta";
import { Hero } from "./_components/hero";
import { Problem } from "./_components/problem";
import { ProofBar } from "./_components/proof-bar";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { Steps } from "./_components/steps";

export const metadata: Metadata = {
  title: { absolute: "WINE · Équipe, CRM et facturation au même endroit" },
  description:
    "Projets, tâches, chat, CRM Contravo, devis et Mobile Money, PWA et analytics IA — pour les équipes francophones et ouest-africaines.",
};

/** Landing page publique, servie sur « / » aux visiteurs non connectés (réécriture dans proxy.ts). */
export default function LandingPage() {
  return (
    <div className="app-mesh min-h-dvh">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu">
        <Hero />
        <Reveal as="div" variant="fade">
          <ProofBar />
        </Reveal>
        <Reveal as="div" delay={1}>
          <Problem />
        </Reveal>
        <Reveal as="div" delay={1}>
          <Features />
        </Reveal>
        <Reveal as="div">
          <Steps />
        </Reveal>
        <Reveal as="div" variant="fade">
          <Faq />
        </Reveal>
        <Reveal as="div" variant="scale">
          <FinalCta />
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
