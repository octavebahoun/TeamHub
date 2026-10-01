import { Search } from "lucide-react";

/** Recherche serveur (GET ?q=), sans JavaScript requis. */
export function ContactSearch({ q, type }: { q?: string; type?: string }) {
  return (
    <form role="search" className="relative w-full max-w-md">
      {type && <input type="hidden" name="type" value={type} />}
      <label htmlFor="crm-q" className="sr-only">Rechercher un contact</label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <input id="crm-q" name="q" type="search" defaultValue={q} placeholder="Nom, entreprise, email…" className="h-11 w-full rounded-lg border bg-background pr-4 pl-10.5 placeholder:text-subtle-foreground" />
    </form>
  );
}
