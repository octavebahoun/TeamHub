import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TRIAL_OFFER } from "../content";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-3xl px-5 pt-16 pb-24 sm:px-8 lg:pt-24">
      <div>
        <h1 id="hero-title" className="font-heading text-[42px] leading-[1.08] sm:text-[56px] xl:text-[60px]">
          Toute votre équipe, <br className="hidden sm:inline" />
          <em className="text-primary italic">au même endroit</em>.
        </h1>
        <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-muted-foreground">
          Projets, tâches, chat et clients dans une seule plateforme. Fini les allers-retours entre WhatsApp, Excel et les carnets.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/inscription" className={buttonVariants({ size: "lg", className: "h-13 px-7 text-[17px] transition-none! hover:bg-primary!" })}>
            Créer mon espace
          </Link>
          <a href="#fonctionnalites" className={buttonVariants({ size: "lg", variant: "outline", className: "h-13 px-7 text-[17px] transition-none! hover:bg-background! hover:text-foreground!" })}>
            Voir les fonctionnalités
          </a>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">{[TRIAL_OFFER, "Sans installation"].filter(Boolean).join(" · ")}</p>
      </div>
    </section>
  );
}
