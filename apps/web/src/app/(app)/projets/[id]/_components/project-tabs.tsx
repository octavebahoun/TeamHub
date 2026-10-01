import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tab = { label: string; href: string; current?: boolean };

/** Onglets de navigation du projet (liens : chaque onglet a sa propre URL). */
export function ProjectTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <nav aria-label="Sections du projet" className="mb-8 border-b">
      <ul className="relative -mb-px flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.current ? "page" : undefined}
              className={cn(
                "inline-flex h-12 items-center border-b-[3px] px-4 whitespace-nowrap transition-colors",
                t.current ? "border-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
