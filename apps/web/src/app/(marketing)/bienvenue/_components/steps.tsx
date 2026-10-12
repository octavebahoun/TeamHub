import { STEPS } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

export function Steps() {
  return (
    <section id="comment-ca-marche" aria-labelledby="etapes" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <Eyebrow>Comment ça marche</Eyebrow>
      <SectionTitle id="etapes">
        Prêt en <em>deux minutes</em>.
      </SectionTitle>
      <ol className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 sm:gap-8 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            data-reveal
            data-reveal-delay={String(Math.min(i, 5))}
            className="reveal panel-premium surface-lift relative rounded-2xl p-6 sm:p-7"
          >
            <span
              aria-hidden
              className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-soft font-heading text-[22px] text-brand-soft-foreground ring-1 ring-primary/15"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 font-sans text-[17px] font-semibold sm:text-[19px]">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:mt-3">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
