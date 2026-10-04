import { STEPS } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

export function Steps() {
  return (
    <section id="comment-ca-marche" aria-labelledby="etapes" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <Eyebrow>Comment ça marche</Eyebrow>
      <SectionTitle id="etapes">
        Prêt en <em>deux minutes</em>.
      </SectionTitle>
      <ol className="mt-8 grid grid-cols-1 gap-8 sm:mt-12 sm:gap-10 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="border-t-2 border-inverse pt-5 sm:pt-6">
            <span aria-hidden className="font-heading text-[36px] leading-none text-primary sm:text-[44px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-sans text-[17px] font-semibold sm:mt-5 sm:text-[19px]">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:mt-3">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
