import Link from "next/link";

export function FinalCta() {
  return (
    <section aria-labelledby="cta" className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-8 rounded-[28px] bg-primary px-8 py-14 text-primary-foreground sm:px-12 md:flex-row md:items-center">
        <h2 id="cta" className="max-w-2xl font-heading text-[34px] leading-tight sm:text-[44px]">
          Mettez votre équipe au même endroit dès aujourd&apos;hui.
        </h2>
        <Link href="/inscription" className="inline-flex h-13 shrink-0 items-center rounded-md bg-background px-7 text-[17px] font-semibold text-brand-soft-foreground">
          Créer mon espace
        </Link>
      </div>
    </section>
  );
}
