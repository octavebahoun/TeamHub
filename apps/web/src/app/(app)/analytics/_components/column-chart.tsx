import { cn } from "@/lib/utils";
import { DataTable } from "./data-table";

/**
 * Histogramme vertical à une série. Valeurs écrites au-dessus des barres,
 * infobulle au survol et au focus clavier, tableau de données en repli.
 * `muted` : barres atténuées (ex. semaine en cours, incomplète).
 */
export function ColumnChart({ title, data, unit, muted = [] }: { title: string; data: { label: string; value: number }[]; unit: string; muted?: string[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div className="flex h-60 items-end justify-around gap-3 border-b px-2" role="list" aria-label={title}>
        {data.map((d) => (
          <div key={d.label} role="listitem" className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-2 text-[15px] font-semibold tabular-nums">{d.value}</span>
            <div
              tabIndex={0}
              role="img"
              aria-label={`${d.label} : ${d.value} ${unit}`}
              className={cn(
                "w-full max-w-24 rounded-t-[4px] transition-opacity outline-offset-2 hover:opacity-85 focus-visible:opacity-85",
                muted.includes(d.label) ? "bg-brand-light" : "bg-primary"
              )}
              style={{ height: `${(d.value / max) * 80}%` }}
            />
            <span role="tooltip" className="pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-md bg-inverse px-2.5 py-1.5 text-xs whitespace-nowrap text-inverse-foreground group-focus-within:block group-hover:block">
              <strong>{d.value}</strong> {unit} · {d.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-around gap-3 px-2 pt-3 text-sm text-muted-foreground" aria-hidden>
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">{d.label}</span>
        ))}
      </div>
      <DataTable caption={title} columns={["Période", unit]} rows={data.map((d) => [d.label, String(d.value)])} />
    </figure>
  );
}
