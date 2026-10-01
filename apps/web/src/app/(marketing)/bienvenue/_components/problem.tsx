import { AFTER, BEFORE } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

export function Problem() {
  return (
    <section aria-labelledby="probleme" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Eyebrow>Le problème</Eyebrow>
      <SectionTitle id="probleme">
        L&apos;information se perd <em>entre les outils</em>.
      </SectionTitle>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-secondary p-8">
          <h3 className="mb-5 font-sans text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">Avant</h3>
          <ul className="space-y-4 text-[17px] text-secondary-foreground">
            {BEFORE.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
          <h3 className="mb-5 font-sans text-sm font-semibold tracking-[0.14em] uppercase">Avec WINE</h3>
          <ul className="space-y-4 text-[17px]">
            {AFTER.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
