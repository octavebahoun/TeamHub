import { cn } from "@/lib/utils";

const COLUMNS = [
  { label: "À faire", dot: "bg-subtle-foreground", cards: [["Relancer facture MoMo", "Demain", "KA"], ["Devis express client", "12 oct.", "AD"]] },
  { label: "En cours", dot: "bg-primary", cards: [["Note vocale client", "Aujourd'hui", "OB"], ["Inbox WhatsApp CRM", "Aujourd'hui", "AD"]] },
  { label: "Terminé", dot: "bg-success", cards: [["Contrat signé Contravo", "28 sept.", "OB"]] },
];

/** Aperçu produit immersif. */
export function HeroPreview() {
  return (
    <div
      role="img"
      aria-label="Aperçu de WINE : Kanban et message projet"
      className="relative mx-auto w-full max-w-lg min-w-0 lg:max-w-none"
    >
      <div aria-hidden className="absolute -inset-6 rounded-[2.25rem] bg-gradient-to-br from-primary/45 via-primary/10 to-info/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary via-primary to-primary-hover p-[1px] shadow-[0_40px_90px_-32px_var(--primary)] sm:rounded-[2rem]">
        <div className="rounded-[calc(1.75rem-1px)] bg-card/95 backdrop-blur-xl sm:rounded-[calc(2rem-1px)]">
          <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5 sm:px-4">
            <span aria-hidden className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-brand-light/80" />
              <span className="size-2.5 rounded-full bg-success/70" />
            </span>
            <span className="mx-auto truncate rounded-lg bg-muted/80 px-3 py-1 text-[11px] text-muted-foreground">
              app.wine · Tâches
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
              <span className="live-dot size-1.5 rounded-full bg-success" />
              Live
            </span>
          </div>

          <div className="p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <p className="truncate font-heading text-[17px] sm:text-[20px]">Tâches · WINE V1</p>
              <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-soft-foreground sm:px-3 sm:text-xs">
                M1 en cours
              </span>
            </div>
            <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
              {COLUMNS.map((c) => (
                <div
                  key={c.label}
                  className="w-[min(72vw,16rem)] shrink-0 snap-center rounded-xl border border-border/50 bg-muted/40 p-2.5 sm:w-auto"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                    <span className={cn("size-2 rounded-full", c.dot)} />
                    {c.label}
                  </p>
                  <div className="space-y-2">
                    {c.cards.map(([title, date, who]) => (
                      <div
                        key={title}
                        className="rounded-lg border border-border/60 bg-card/90 p-2.5 shadow-sm transition-transform hover:-translate-y-0.5"
                      >
                        <p className="text-xs leading-snug font-semibold">{title}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          {date}
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-inverse text-[9px] font-semibold text-inverse-foreground">
                            {who}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="relative mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-[0_16px_40px_-20px_rgb(0_0_0/0.45)] backdrop-blur-xl sm:absolute sm:-bottom-4 sm:left-3 sm:mt-0 sm:max-w-[88%]"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_var(--primary)]">
          KA
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-semibold"># wine-v1</span>
          <span className="block truncate text-xs text-muted-foreground">« Acompte MoMo reçu — projet débloqué »</span>
        </span>
        <span className="live-dot ml-auto hidden size-2 shrink-0 rounded-full bg-success sm:block" />
      </div>
    </div>
  );
}
