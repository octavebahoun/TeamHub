import { STEPS } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

export function Steps() {
  return (
    <section id="comment-ca-marche" aria-labelledby="etapes" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Eyebrow>Comment ça marche</Eyebrow>
      <SectionTitle id="etapes">
        Prêt en <em>deux minutes</em>.
      </SectionTitle>
      <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="border-t-2 border-inverse pt-6">
            <span aria-hidden className="font-heading text-[44px] leading-none text-primary">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-5 font-sans text-[19px] font-semibold">{s.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
