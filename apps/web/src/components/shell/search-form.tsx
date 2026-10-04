"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

/** Recherche globale (projets, tâches, clients) → /recherche?q=. */
export function SearchForm() {
  const params = useSearchParams();
  const onResults = usePathname() === "/recherche";
  return (
    <form role="search" action="/recherche" className="relative min-w-0 flex-1 max-w-xl">
      <label htmlFor="global-search" className="sr-only">
        Rechercher un projet, une tâche, un client
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="global-search"
        key={onResults ? params.get("q") : "search"}
        name="q"
        type="search"
        defaultValue={onResults ? (params.get("q") ?? "") : ""}
        placeholder="Rechercher…"
        title="Rechercher un projet, une tâche, un client"
        className="h-9 w-full min-w-0 rounded-xl border-0 bg-muted/70 pr-3 pl-9 text-[15px] outline-none transition-colors placeholder:text-subtle-foreground focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-10"
      />
    </form>
  );
}
