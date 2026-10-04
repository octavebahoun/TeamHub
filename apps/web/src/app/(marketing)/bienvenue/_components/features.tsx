import {
  BarChart3,
  Briefcase,
  FolderClosed,
  MessageSquare,
  Smartphone,
  Search,
  ShieldCheck,
  SquareCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HIGHLIGHTS, MODULES } from "../content";
import { Eyebrow, SectionTitle } from "./eyebrow";

const MODULE_ICONS: Record<(typeof MODULES)[number]["icon"], LucideIcon> = {
  projects: FolderClosed,
  tasks: SquareCheck,
  chat: MessageSquare,
  social: Users,
  analytics: BarChart3,
  crm: Briefcase,
};

const HIGHLIGHT_ICONS: Record<(typeof HIGHLIGHTS)[number]["icon"], LucideIcon> = {
  pwa: Smartphone,
  files: ShieldCheck,
  search: Search,
  money: Wallet,
};

export function Features() {
  return (
    <section id="fonctionnalites" aria-labelledby="modules" className="scroll-mt-20 border-y bg-muted/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Eyebrow>Fonctionnalités</Eyebrow>
        <SectionTitle id="modules">
          Travaillez, vendez et facturez — <em>dans WINE</em>.
        </SectionTitle>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:mt-5 sm:text-[17px]">
          Les six modules historiques, enrichis : Contravo, notes vocales, fichiers sécurisés, PWA et analytics IA pour les équipes ouest-africaines.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = MODULE_ICONS[m.icon];
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

        <h3 className="mt-12 font-heading text-[22px] sm:mt-16 sm:text-[26px]">Aussi dans WINE</h3>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => {
            const Icon = HIGHLIGHT_ICONS[h.icon];
            return (
              <li key={h.title} className="rounded-2xl border border-dashed bg-background/80 p-5">
                <span
                  aria-hidden
                  className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground"
                >
                  <Icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <h4 className="font-sans text-[16px] font-semibold">{h.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
