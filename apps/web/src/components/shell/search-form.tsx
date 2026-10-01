"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

/** Recherche globale (projets, tâches, clients) → /recherche?q=. Garde le terme saisi sur la page de résultats. */
export function SearchForm() {
  const params = useSearchParams();
  const onResults = usePathname() === "/recherche";
  return (
    <form role="search" action="/recherche" className="relative w-full max-w-120">
      <label htmlFor="global-search" className="sr-only">
        Rechercher un projet, une tâche, un client
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <input
        id="global-search"
        key={onResults ? params.get("q") : "search"}
        name="q"
        type="search"
        defaultValue={onResults ? (params.get("q") ?? "") : ""}
        placeholder="Rechercher un projet, une tâche, un client…"
        className="h-11 w-full rounded-lg border bg-muted pr-4 pl-10.5 text-[15px] placeholder:text-subtle-foreground focus-visible:bg-background"
      />
    </form>
  );
}
