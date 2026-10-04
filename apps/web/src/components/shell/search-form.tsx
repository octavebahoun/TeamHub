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
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground sm:left-3.5 sm:size-4.5" />
      <input
        id="global-search"
        key={onResults ? params.get("q") : "search"}
        name="q"
        type="search"
        defaultValue={onResults ? (params.get("q") ?? "") : ""}
        placeholder="Rechercher…"
        title="Rechercher un projet, une tâche, un client"
        className="h-10 w-full min-w-0 rounded-xl border bg-muted pr-3 pl-9 text-[15px] placeholder:text-subtle-foreground focus-visible:bg-background sm:h-11 sm:pl-10.5"
      />
    </form>
  );
}
