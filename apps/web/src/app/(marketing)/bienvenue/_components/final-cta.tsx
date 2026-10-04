import Link from "next/link";

export function FinalCta() {
  return (
    <section aria-labelledby="cta" className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="glow-active flex flex-col items-stretch justify-between gap-6 rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-hover px-5 py-10 text-primary-foreground sm:gap-8 sm:rounded-[28px] sm:px-12 sm:py-14 md:flex-row md:items-center">
        <h2 id="cta" className="max-w-2xl font-heading text-[clamp(1.5rem,5vw,2.75rem)] leading-tight">
          Mettez votre équipe au même endroit dès aujourd&apos;hui.
        </h2>
        <Link
          href="/inscription"
          className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-background px-7 text-[16px] font-semibold text-brand-soft-foreground transition-opacity hover:bg-background/90 sm:h-13 sm:w-auto sm:text-[17px]"
        >
          Créer mon espace
        </Link>
      </div>
    </section>
  );
}
