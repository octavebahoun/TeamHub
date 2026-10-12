"use client";

import { useEffect, useState } from "react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { StatCard } from "@/components/common/stat-card";
import { compactMoney } from "@/lib/format";
import { loadFinancialSnapshot } from "@/lib/actions/analytics-board";
import type { FinancialSnapshot } from "@/lib/api/wine-contract";

/** Widget branché sur analytics/overview et analytics/pipeline. */
export function FinancialHealth() {
  const [stats, setStats] = useState<FinancialSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await loadFinancialSnapshot();
        if (!cancelled) setStats(snap);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Données indisponibles");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Santé financière</PanelTitle>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Chiffre d'affaires" value={stats ? compactMoney(stats.revenueXof) : "—"} hint="Factures émises, FCFA" active />
          <StatCard label="Cash" value={stats ? compactMoney(stats.cashXof) : "—"} hint="Encaissé, FCFA" />
          <StatCard
            label="Marge"
            value={stats ? `${Math.round(stats.marginRate * 100)} %` : "—"}
            hint="Part du CA déjà encaissée"
          />
          <StatCard label="Pipeline ouvert" value={stats ? compactMoney(stats.openPipelineXof) : "—"} hint="FCFA, hors gagné et perdu" />
          <StatCard label="Devis en cours" value={stats ? compactMoney(stats.openQuotesXof) : "—"} hint="Brouillons et devis envoyés, FCFA" />
        </div>
      )}
    </Panel>
  );
}
