import type { AnalyticsOverview, AnalyticsPipeline, ProfitabilityRow, StatsActivityItem, StatsOverview } from "@/lib/data/types";

export const mockAnalyticsOverview: StatsOverview = {
  active_projects: 3,
  overdue_tasks: 2,
  completed_tasks: 47,
  workload: [
    { user_id: 1, name: "Amina Traoré", open_tasks: 4 },
    { user_id: 2, name: "Koffi Mensah", open_tasks: 6 },
    { user_id: 3, name: "Fatou Diop", open_tasks: 5 },
  ],
  completed_per_week: [
    { week: "2026-W35", count: 8 },
    { week: "2026-W36", count: 11 },
    { week: "2026-W37", count: 9 },
    { week: "2026-W38", count: 14 },
    { week: "2026-W39", count: 10 },
  ],
  late_projects: [{ id: 202, name: "Portail municipal Porto-Novo", overdue: 3 }],
  open_quotes_xof: 9_600_000,
  unpaid_invoices_xof: 2_060_000,
  signed_contracts: 2,
};

export const mockAnalyticsPipeline: AnalyticsPipeline = {
  by_stage: [
    { stage: "prospect", count: 4, amount: 2_800_000 },
    { stage: "contacted", count: 3, amount: 4_100_000 },
    { stage: "proposal", count: 2, amount: 6_200_000 },
    { stage: "won", count: 5, amount: 12_450_000 },
    { stage: "lost", count: 1, amount: 900_000 },
  ],
};

export const mockStatsActivity: StatsActivityItem[] = [
  {
    id: 9001,
    action: "quote.sent",
    user: { id: 1, name: "Amina Traoré" },
    body: "Devis DEV-2026-019 envoyé à Porto-Novo Digital",
    kind: "email",
    created_at: "2026-09-26T10:00:00Z",
    project_id: 202,
    client_id: 102,
  },
  {
    id: 9002,
    action: "invoice.paid",
    user: null,
    meta: { channel: "mtn_momo", amount_xof: 1_940_000 },
    body: "Paiement reçu — Maison Akwa",
    kind: "note",
    created_at: "2026-09-28T14:22:00Z",
    project_id: 201,
    client_id: 101,
  },
  {
    id: 9003,
    action: "task.completed",
    user: { id: 2, name: "Koffi Mensah" },
    body: "Rapport campagne Q3 terminé",
    kind: "note",
    created_at: "2026-09-14T17:00:00Z",
    project_id: 205,
    client_id: 105,
  },
];

export const mockProfitability: ProfitabilityRow[] = [
  {
    project_id: 201,
    project_name: "Refonte e-commerce Maison Akwa",
    client_name: "Maison Akwa — Abidjan",
    revenue_xof: 4_850_000,
    cost_xof: 2_900_000,
    margin_pct: 40.2,
  },
  {
    project_id: 205,
    project_name: "Campagne Celtiis Bénin",
    client_name: "Celtiis Cotonou",
    revenue_xof: 2_150_000,
    cost_xof: 980_000,
    margin_pct: 54.4,
  },
  {
    project_id: 202,
    project_name: "Portail municipal Porto-Novo",
    client_name: "Porto-Novo Digital",
    revenue_xof: 1_200_000,
    cost_xof: 1_050_000,
    margin_pct: 12.5,
  },
];

/** Alias pour réutilisation côté écrans analytics existants. */
export const mockOverview: AnalyticsOverview = mockAnalyticsOverview;
