import { Minus, Plus } from "lucide-react";
import { CONTACT_EMAIL, FAQ } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

/** Questions fréquentes en <details> natifs : ouverture au clavier et lecteurs d'écran sans JavaScript. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
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
        <div className="border-t">
          {FAQ.map((item, i) => (
            <details key={item.q} open={i === 0} className="group border-b py-6">
              <summary className="flex cursor-pointer list-none items-center gap-6 rounded-md [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="w-6 text-sm font-semibold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-[18px] font-semibold">{item.q}</span>
                <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary group-open:bg-primary group-open:text-primary-foreground">
                  <Plus className="size-4 group-open:hidden" />
                  <Minus className="hidden size-4 group-open:block" />
                </span>
              </summary>
              <p className="mt-4 pr-16 pl-12 leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
