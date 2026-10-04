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
    <section id="fonctionnalites" aria-labelledby="modules" className="scroll-mt-20 border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <Eyebrow>Fonctionnalités</Eyebrow>
        <SectionTitle id="modules">
          Travaillez, vendez et facturez — <em>dans WINE</em>.
        </SectionTitle>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:mt-5 sm:text-[17px]">
          Les six modules historiques, enrichis : Contravo, notes vocales, fichiers sécurisés, PWA et analytics IA pour les équipes ouest-africaines.
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {MODULES.map((m, i) => {
            const Icon = MODULE_ICONS[m.icon];
            return (
              <li
                key={m.title}
                data-reveal
                data-reveal-delay={String(Math.min(i, 5))}
                className="reveal panel-premium surface-lift group relative overflow-hidden rounded-2xl p-5 sm:p-7"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground ring-1 ring-primary/15 sm:mb-5 sm:size-12"
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="relative font-heading text-[22px] sm:text-[24px]">{m.title}</h3>
                <p className="relative mt-2 text-[15px] leading-relaxed text-muted-foreground sm:mt-3">{m.text}</p>
              </li>
            );
          })}
        </ul>

        <h3 className="mt-12 font-heading text-[22px] sm:mt-16 sm:text-[26px]">Aussi dans WINE</h3>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => {
            const Icon = HIGHLIGHT_ICONS[h.icon];
            return (
              <li
                key={h.title}
                data-reveal
                data-reveal-delay={String(Math.min(i, 5))}
                className="reveal surface-lift rounded-2xl border border-dashed border-border/70 bg-background/60 p-5 backdrop-blur-sm"
              >
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
