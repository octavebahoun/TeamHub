import Link from "next/link";
import { cn } from "@/lib/utils";

/** Bascule Kanban / Liste (deux liens, état dans l'URL). */
export function ViewToggle({ view, hrefFor }: { view: "kanban" | "liste"; hrefFor: (v: "kanban" | "liste") => string }) {
  return (
    <nav aria-label="Affichage" className="inline-flex rounded-lg bg-secondary p-1">
      {(["kanban", "liste"] as const).map((v) => (
        <Link
          key={v}
          href={hrefFor(v)}
          scroll={false}
          aria-current={view === v ? "page" : undefined}
          className={cn("inline-flex h-9 items-center rounded-md px-4 text-[15px]", view === v ? "bg-background font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground")}
        >
          {v === "kanban" ? "Kanban" : "Liste"}
        </Link>
      ))}
    </nav>
  );
}
