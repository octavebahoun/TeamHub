import { cn } from "@/lib/utils";

const COLUMNS = [
  { label: "À faire", dot: "bg-subtle-foreground", cards: [["Rappels avant échéance", "10 oct.", "KA"], ["Filtres par date", "12 oct.", "AD"]] },
  { label: "En cours", dot: "bg-primary", cards: [["Maquette du Kanban", "Aujourd'hui", "OB"], ["POST /projects", "Aujourd'hui", "AD"]] },
  { label: "Terminé", dot: "bg-success", cards: [["Authentification", "28 sept.", "OB"]] },
];

/** Aperçu décoratif du produit (Kanban + message) ; décrit par un seul libellé pour les lecteurs d'écran. */
export function HeroPreview() {
  return (
    <div role="img" aria-label="Aperçu de WINE : le Kanban du projet WINE V1 et un message dans le canal du projet" className="relative">
      <div aria-hidden className="rounded-[28px] bg-primary p-5 sm:p-7">
        <div className="rounded-2xl bg-background p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-heading text-[20px]">Tâches · WINE V1</p>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-soft-foreground">M1 en cours</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {COLUMNS.map((c) => (
              <div key={c.label} className="rounded-xl bg-muted p-2.5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <span className={cn("size-2 rounded-full", c.dot)} />
                  {c.label}
                </p>
                <div className="space-y-2">
                  {c.cards.map(([title, date, who]) => (
                    <div key={title} className="rounded-lg border bg-card p-2.5">
                      <p className="text-xs leading-snug font-semibold">{title}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        {date}
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-inverse text-[9px] font-semibold text-inverse-foreground">{who}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute -bottom-8 -left-3 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-md sm:-left-6">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">KA</span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold"># wine-v1</span>
          <span className="text-xs text-muted-foreground">« Le filtre par étape est en ligne »</span>
        </span>
      </div>
    </div>
  );
}
