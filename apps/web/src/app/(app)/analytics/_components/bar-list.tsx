import { cn } from "@/lib/utils";
import { DataTable } from "./data-table";

export type BarRow = { label: string; value: number; display?: string; strong?: boolean };

/** Barres horizontales à une série (charge par membre, pipeline par étape). */
export function BarList({ title, rows, unit, labelWidth = "w-48", valueOnTop = false }: { title: string; rows: BarRow[]; unit: string; labelWidth?: string; valueOnTop?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure>
      <ul className="space-y-5" aria-label={title}>
        {rows.map((r) => (
          <li key={r.label} className={cn("group relative", valueOnTop ? "space-y-2" : "flex items-center gap-4")}>
            <div className={cn(valueOnTop ? "flex justify-between gap-4" : `${labelWidth} shrink-0`)}>
              <span>{r.label}</span>
              {valueOnTop && <span className="text-muted-foreground tabular-nums">{r.display ?? r.value}</span>}
            </div>
            <div
              tabIndex={0}
              role="img"
              aria-label={`${r.label} : ${r.display ?? r.value} ${unit}`}
              className="h-3.5 flex-1 overflow-hidden rounded-full bg-secondary outline-offset-2"
            >
              <div className={cn("h-full rounded-full", r.strong ? "bg-brand-soft-foreground" : "bg-primary")} style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
            </div>
            {!valueOnTop && <span className="w-8 text-right font-semibold tabular-nums">{r.display ?? r.value}</span>}
          </li>
        ))}
      </ul>
      <DataTable caption={title} columns={["", unit]} rows={rows.map((r) => [r.label, String(r.display ?? r.value)])} />
    </figure>
  );
}
