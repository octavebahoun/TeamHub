import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TRIAL_OFFER } from "../content";
import { Eyebrow } from "./eyebrow";
import { HeroPreview } from "./hero-preview";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="aurora-bg relative overflow-x-clip border-b"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-10 pb-16 sm:gap-14 sm:px-8 sm:pt-16 sm:pb-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:pt-20">
        <div className="min-w-0">
          <Eyebrow>Pour les équipes francophones</Eyebrow>
          <h1
            id="hero-title"
            className="mt-3 font-heading text-[clamp(1.85rem,6.5vw,3.75rem)] leading-[1.12] tracking-tight"
          >
            <span className="block text-foreground">Toute votre équipe,</span>
            <em className="text-primary italic">au même endroit</em>.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-[18px]">
            Projets, tâches, chat et clients dans une seule plateforme. Fini les allers-retours entre WhatsApp, Excel et les carnets.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Link href="/inscription" className={buttonVariants({ size: "lg", className: "h-12 w-full justify-center px-7 text-[16px] sm:h-13 sm:w-auto sm:text-[17px]" })}>
              Créer mon espace
            </Link>
            <a
              href="#fonctionnalites"
              className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 w-full justify-center px-7 text-[16px] sm:h-13 sm:w-auto sm:text-[17px]" })}
            >
              Voir les fonctionnalités
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground sm:mt-5">{[TRIAL_OFFER, "Sans installation"].filter(Boolean).join(" · ")}</p>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}
