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
        <div className="rounded-2xl border bg-secondary/80 p-5 sm:p-8">
          <h3 className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase sm:mb-5 sm:text-sm">
            Avant
          </h3>
          <ul className="space-y-3 text-[15px] text-secondary-foreground sm:space-y-4 sm:text-[17px]">
            {BEFORE.map((b) => (
              <li key={b} className="leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="glow-active rounded-2xl bg-primary p-5 text-primary-foreground sm:p-8">
          <h3 className="mb-4 font-sans text-xs font-semibold tracking-[0.14em] uppercase sm:mb-5 sm:text-sm">Avec WINE</h3>
          <ul className="space-y-3 text-[15px] sm:space-y-4 sm:text-[17px]">
            {AFTER.map((a) => (
              <li key={a} className="leading-relaxed">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
