"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { Panel, PanelTitle } from "@/components/common/panel";

type Stats = { caCents: string; quotesCount: number; projectsCount: number; balanceDueCents: string };

export function CrmEnrichment({ contravoClientId }: { contravoClientId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/contravo/clients/${encodeURIComponent(contravoClientId)}/enrichment`, { headers: { Accept: "application/json" } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Erreur");
        if (!cancelled) setStats(data.stats as Stats);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Données indisponibles");
      }
    })();
    return () => { cancelled = true; };
  }, [contravoClientId]);

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-4">Contravo · Synthèse</PanelTitle>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {!stats && !error && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {stats && (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">CA encaissé</dt>
            <dd className="font-semibold">{money(stats.caCents)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Devis</dt>
            <dd className="font-semibold">{stats.quotesCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Projets Contravo</dt>
            <dd className="font-semibold">{stats.projectsCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Solde dû</dt>
            <dd className="font-semibold">{money(stats.balanceDueCents)}</dd>
          </div>
        </dl>
      )}
    </Panel>
  );
}
