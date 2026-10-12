import { Check, X } from "lucide-react";
import { AFTER, BEFORE } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

export function Problem() {
  return (
    <section aria-labelledby="probleme" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <Eyebrow>Le problème</Eyebrow>
      <SectionTitle id="probleme">
        L&apos;information se perd <em>entre les outils</em>.
      </SectionTitle>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2">
        <div data-reveal data-reveal-variant="left" className="reveal rounded-2xl border border-border/70 bg-secondary/60 p-5 backdrop-blur-sm sm:p-8">
          <h3 className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:mb-5 sm:text-sm">
            Avant
          </h3>
          <ul className="space-y-3.5 text-[15px] text-secondary-foreground sm:space-y-4 sm:text-[17px]">
            {BEFORE.map((b) => (
              <li key={b} className="flex gap-3 leading-relaxed">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <X className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div
          data-reveal
          data-reveal-variant="right"
          data-reveal-delay="1"
          className="reveal glow-active relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-hover p-5 text-primary-foreground sm:p-8"
        >
          <div aria-hidden className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-white/15 blur-2xl" />
          <h3 className="relative mb-4 font-sans text-xs font-semibold tracking-[0.14em] uppercase sm:mb-5 sm:text-sm">
            Avec WINE
          </h3>
          <ul className="relative space-y-3.5 text-[15px] sm:space-y-4 sm:text-[17px]">
            {AFTER.map((a) => (
              <li key={a} className="flex gap-3 leading-relaxed">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
