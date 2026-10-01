import { BarChart3, Briefcase, FolderClosed, MessageSquare, SquareCheck, Users } from "lucide-react";
import { MODULES } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

const ICONS = { projects: FolderClosed, tasks: SquareCheck, chat: MessageSquare, social: Users, analytics: BarChart3, crm: Briefcase };

export function Features() {
  return (
    <section id="fonctionnalites" aria-labelledby="modules" className="scroll-mt-20 border-y bg-muted">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Eyebrow>Fonctionnalités</Eyebrow>
        <SectionTitle id="modules">
          Six modules, <em>un seul outil</em>.
        </SectionTitle>
        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = ICONS[m.icon];
            return (
              <li key={m.title} className="rounded-2xl border bg-card p-7">
                <span aria-hidden className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-heading text-[24px]">{m.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{m.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
