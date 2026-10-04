import { cn } from "@/lib/utils";

const COLUMNS = [
  { label: "À faire", dot: "bg-subtle-foreground", cards: [["Relancer facture MoMo", "Demain", "KA"], ["Devis express client", "12 oct.", "AD"]] },
  { label: "En cours", dot: "bg-primary", cards: [["Note vocale client", "Aujourd'hui", "OB"], ["Inbox WhatsApp CRM", "Aujourd'hui", "AD"]] },
  { label: "Terminé", dot: "bg-success", cards: [["Contrat signé Contravo", "28 sept.", "OB"]] },
];

/** Aperçu produit : scroll horizontal sur mobile, grille 3 colonnes dès sm. */
export function HeroPreview() {
  return (
    <div
      role="img"
      aria-label="Aperçu de WINE : le Kanban du projet WINE V1 et un message dans le canal du projet"
      className="relative mx-auto w-full max-w-lg min-w-0 lg:max-w-none"
    >
      <div aria-hidden className="glow-active rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-hover p-3 shadow-lg sm:rounded-[28px] sm:p-5">
        <div className="glass rounded-2xl border bg-background/95 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <p className="truncate font-heading text-[17px] sm:text-[20px]">Tâches · WINE V1</p>
            <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-soft-foreground sm:px-3 sm:text-xs">
              M1 en cours
            </span>
          </div>

          {/* Mobile : carrousel horizontal snap — desktop : 3 colonnes */}
          <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-2.5 sm:overflow-visible sm:px-0 sm:pb-0">
            {COLUMNS.map((c) => (
              <div
                key={c.label}
                className="w-[min(72vw,16rem)] shrink-0 snap-center rounded-xl bg-muted/90 p-2.5 sm:w-auto sm:shrink"
              >
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <span className={cn("size-2 rounded-full", c.dot)} />
                  {c.label}
                </p>
                <div className="space-y-2">
                  {c.cards.map(([title, date, who]) => (
                    <div key={title} className="rounded-lg border bg-card p-2.5 shadow-xs">
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

      {/* Bulle chat : dans le flux sur mobile, flottante dès sm */}
      <div
        aria-hidden
        className="mt-4 flex items-center gap-3 rounded-2xl border bg-card/95 px-4 py-3 shadow-md backdrop-blur sm:absolute sm:-bottom-5 sm:left-4 sm:mt-0 sm:max-w-[85%]"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">KA</span>
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-semibold"># wine-v1</span>
          <span className="block truncate text-xs text-muted-foreground">« Acompte MoMo reçu — projet débloqué »</span>
        </span>
      </div>
    </div>
  );
}
