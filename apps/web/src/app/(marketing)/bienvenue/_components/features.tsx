import { BarChart3, Briefcase, FolderClosed, MessageSquare, SquareCheck, Users } from "lucide-react";
import { MODULES } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

const ICONS = { projects: FolderClosed, tasks: SquareCheck, chat: MessageSquare, social: Users, analytics: BarChart3, crm: Briefcase };

export function Features() {
  return (
    <section id="fonctionnalites" aria-labelledby="modules" className="scroll-mt-20 border-y bg-muted/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Eyebrow>Fonctionnalités</Eyebrow>
        <SectionTitle id="modules">
          Six modules, <em>un seul outil</em>.
        </SectionTitle>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = ICONS[m.icon];
            return (
              <li
                key={m.title}
                className="rounded-2xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md sm:p-7 dark:glass"
              >
                <span
                  aria-hidden
                  className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground sm:mb-5 sm:size-12"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-heading text-[22px] sm:text-[24px]">{m.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:mt-3">{m.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
