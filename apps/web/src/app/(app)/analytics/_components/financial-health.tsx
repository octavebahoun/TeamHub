"use client";

import { useEffect, useState } from "react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { StatCard } from "@/components/common/stat-card";
import { compactMoney, money } from "@/lib/format";
import { overview, profitability } from "@/lib/api/stats";
import type { ProfitabilityRow, StatsOverview } from "@/lib/data/types";

/** Widget santé financière : marge, CA, charges, cash (mocks /stats). */
export function FinancialHealth() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [rows, setRows] = useState<ProfitabilityRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [o, p] = await Promise.all([overview(), profitability()]);
        if (!cancelled) {
          setStats(o);
          setRows(p);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Données indisponibles");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const revenue = rows.reduce((s, r) => s + r.revenue_xof, 0);
  const cost = rows.reduce((s, r) => s + r.cost_xof, 0);
  const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  const collected = Math.max(0, revenue - (stats?.unpaid_invoices_xof ?? 0));

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Santé financière</PanelTitle>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Marge brute" value={`${margin.toFixed(1)} %`} hint="Sur projets suivis" active />
          <StatCard label="CA facturé" value={compactMoney(revenue)} hint="FCFA" />
          <StatCard label="Charges" value={compactMoney(cost)} hint="Coûts projet" />
          <StatCard label="Cash collecté" value={compactMoney(collected)} hint={stats ? `Impayés ${money(stats.unpaid_invoices_xof ?? 0)}` : undefined} />
        </div>
      )}
    </Panel>
  );
}
