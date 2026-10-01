import type { Metadata } from "next";
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
  title: { absolute: "WINE · Toute votre équipe, au même endroit" },
  description: "Projets, tâches, chat et clients dans une seule plateforme, pour les équipes francophones.",
};

/** Landing page publique, servie sur « / » aux visiteurs non connectés (réécriture dans proxy.ts). */
export default function LandingPage() {
  return (
    <>
      <a href="#contenu" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu">
        <Hero />
        <ProofBar />
        <Problem />
        <Features />
        <Steps />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
