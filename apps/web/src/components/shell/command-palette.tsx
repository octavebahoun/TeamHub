"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderKanban, Receipt, Search, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { search as searchApi } from "@/lib/api/search";
import type { SearchResults } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type FlatHit = {
  key: string;
  href: string;
  title: string;
  subtitle?: string;
  type: "project" | "task" | "client" | "quote";
};

const ICONS = {
  project: FolderKanban,
  task: FileText,
  client: Users,
  quote: Receipt,
} as const;

function flatten(res: SearchResults): FlatHit[] {
  return [
    ...res.projects.map((p) => ({
      key: `p-${p.id}`,
      type: "project" as const,
      href: `/projets/${p.id}`,
      title: p.name,
      subtitle: p.client_name ?? undefined,
    })),
    ...res.tasks.map((t) => ({
      key: `t-${t.id}`,
      type: "task" as const,
      href: `/taches/${t.id}`,
      title: t.title,
      subtitle: t.project_name,
    })),
    ...res.clients.map((c) => ({
      key: `c-${c.id}`,
      type: "client" as const,
      href: `/crm/${c.id}`,
      title: c.company ?? c.name,
      subtitle: c.city ?? c.name,
    })),
    ...res.quotes.map((q) => ({
      key: `q-${q.id}`,
      type: "quote" as const,
      href: `/crm`,
      title: `${q.number} — ${q.title}`,
      subtitle: `${q.amount_xof.toLocaleString("fr-FR")} XOF`,
    })),
  ];
}

/** Palette Cmd/Ctrl+K — recherche globale groupée. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<FlatHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQ("");
      setHits([]);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      void searchApi(q.trim())
        .then((res) => {
          if (!cancelled) {
            setHits(flatten(res));
            setActive(0);
          }
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, open]);

  const groups = useMemo(() => {
    const order = ["project", "task", "client", "quote"] as const;
    const labels = { project: "Projets", task: "Tâches", client: "Clients", quote: "Devis" } as const;
    return order
      .map((type) => ({ type, label: labels[type], items: hits.filter((h) => h.type === type) }))
      .filter((g) => g.items.length > 0);
  }, [hits]);

  const go = useCallback(
    (hit: FlatHit) => {
      setOpen(false);
      router.push(hit.href);
    },
    [router]
  );

  const highlight = (text: string) => {
    const needle = q.trim();
    if (!needle) return text;
    const i = text.toLowerCase().indexOf(needle.toLowerCase());
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="rounded-sm bg-brand-soft px-0.5 text-brand-soft-foreground">{text.slice(i, i + needle.length)}</mark>
        {text.slice(i + needle.length)}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Recherche rapide</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && hits[active]) {
                e.preventDefault();
                go(hits[active]);
              }
            }}
            placeholder="Rechercher projets, tâches, clients…"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            aria-label="Recherche globale"
          />
          <kbd className="hidden rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {q.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Tapez au moins 2 caractères · Ctrl/⌘ K</p>
          ) : loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground" role="status">
              Recherche…
            </p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat</p>
          ) : (
            groups.map((g) => (
              <div key={g.type} className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.label}</p>
                <ul>
                  {g.items.map((hit) => {
                    const idx = hits.findIndex((h) => h.key === hit.key);
                    const Icon = ICONS[hit.type];
                    return (
                      <li key={hit.key}>
                        <button
                          type="button"
                          onClick={() => go(hit)}
                          onMouseEnter={() => setActive(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                            idx === active ? "bg-brand-soft text-brand-soft-foreground" : "hover:bg-muted"
                          )}
                        >
                          <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
                          <span className="min-w-0 flex-1 truncate font-medium">{highlight(hit.title)}</span>
                          {hit.subtitle && <span className="max-w-[40%] truncate text-xs opacity-70">{hit.subtitle}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
