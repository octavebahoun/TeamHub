import Link from "next/link";
import { cn } from "@/lib/utils";

export type Chip = { label: string; count?: number; href: string; active: boolean };

/** Filtres en pastilles (« Tous · 6 », « En cours · 3 »…) pilotés par l'URL. */
export function FilterChips({ chips, label }: { chips: Chip[]; label: string }) {
  return (
    <nav aria-label={label} className="mb-6">
      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              scroll={false}
              aria-current={c.active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                c.active ? "border-inverse bg-inverse text-inverse-foreground" : "bg-background hover:bg-muted"
              )}
            >
              {c.label}
              {c.count !== undefined && <span>&nbsp;·&nbsp;{c.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
