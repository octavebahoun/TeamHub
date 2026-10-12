import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section aria-labelledby="cta" className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-hover px-5 py-12 text-primary-foreground shadow-[0_40px_80px_-36px_var(--primary)] sm:rounded-[28px] sm:px-12 sm:py-16">
        <div aria-hidden className="orb orb-a -top-20 -left-10 size-64 bg-white/20" />
        <div aria-hidden className="orb orb-b -right-16 -bottom-24 size-72 bg-black/20" />
        <div className="relative flex flex-col items-stretch justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="mb-3 text-[12px] font-semibold tracking-[0.18em] text-primary-foreground/80 uppercase">
              Prêt à démarrer
            </p>
            <h2 id="cta" className="font-heading text-[clamp(1.6rem,5vw,2.85rem)] leading-tight">
              Travaillez, vendez et facturez au même endroit dès aujourd&apos;hui.
            </h2>
          </div>
          <Link
            href="/inscription"
            className="group inline-flex h-13 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-background px-8 text-[16px] font-semibold text-brand-soft-foreground shadow-lg transition-transform hover:bg-background/95 active:translate-y-px sm:w-auto sm:text-[17px]"
          >
            Créer mon espace
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
