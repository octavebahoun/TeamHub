import { Minus, Plus } from "lucide-react";
import { CONTACT_EMAIL, FAQ } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

/** Questions fréquentes en <details> natifs : ouverture au clavier et lecteurs d'écran sans JavaScript. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:gap-12 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <Eyebrow>Questions fréquentes</Eyebrow>
          <SectionTitle id="faq-title">
            Vos <em>doutes</em>, nos réponses.
          </SectionTitle>
          <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
            Votre question n&apos;y est pas ?{" "}
            {CONTACT_EMAIL ? (
              <>
                Écrivez-nous à{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
                  {CONTACT_EMAIL}
                </a>
                .
              </>
            ) : (
              "Posez-la à l'équipe Excellence Team, qui vous répondra."
            )}
          </p>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="group panel-premium rounded-2xl px-4 py-1 transition-shadow open:shadow-md sm:px-5"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 rounded-md py-5 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="w-6 text-sm font-semibold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[17px] font-semibold sm:text-[18px]">{item.q}</span>
                <span
                  aria-hidden
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary transition-colors group-open:bg-primary group-open:text-primary-foreground"
                >
                  <Plus className="size-4 group-open:hidden" />
                  <Minus className="hidden size-4 group-open:block" />
                </span>
              </summary>
              <p className="pr-12 pb-5 pl-10 leading-relaxed text-muted-foreground sm:pl-12">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
