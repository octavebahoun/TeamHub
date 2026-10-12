import { describe, expect, it } from "vitest";
import type { AnalyticsOverview, AnalyticsPipeline } from "@/lib/api/types";
import {
  MARK_ALL_NOTIFICATIONS_PATH,
  attachmentDownloadPath,
  financialFromAnalytics,
  mapInboxList,
  briefFromWeeklySummary,
  mapWineSearch,
  priorityHref,
  summaryFromAnalytics,
} from "@/lib/api/wine-contract";

const overview: AnalyticsOverview = {
  active_projects: 3,
  overdue_tasks: 2,
  workload: [{ user_id: 2, name: "Koffi Mensah", open_tasks: 6 }],
};

const pipeline: AnalyticsPipeline = {
  by_stage: [
    { stage: "prospect", count: 1, amount: 1000 },
    { stage: "proposal", count: 1, amount: 4000 },
    { stage: "won", count: 2, amount: 9000 },
    { stage: "lost", count: 1, amount: 500 },
  ],
};

describe("notifications", () => {
  it("marque tout lu sur POST notifications/read", () => {
    expect(MARK_ALL_NOTIFICATIONS_PATH).toBe("notifications/read");
  });

  it("lit l'enveloppe { data, unread_count } et le champ read_at", () => {
    const items = mapInboxList({
      unread_count: 1,
      data: [
        { id: 7, type: "task.assigned", title: "Nouvelle tâche assignée", body: "Relancer le client", link: "/taches/1", read_at: null, created_at: "2026-10-01T10:00:00Z" },
        { id: 8, type: "post.created", title: "Nouvelle publication", body: null, link: "/social", read_at: "2026-10-02T10:00:00Z", created_at: "2026-10-02T09:00:00Z" },
      ],
    });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: "7", read: false, href: "/taches/1", body: "Relancer le client" });
    expect(items[1].read).toBe(true);
  });
});

describe("recherche", () => {
  it("accepte la réponse de GET /search sans clé quotes et lit le nom du projet imbriqué", () => {
    const res = mapWineSearch({
      query: "akwa",
      projects: [{ id: 1, name: "Maison Akwa", status: "in_progress" }],
      tasks: [{ id: 4, title: "Devis", status: "todo", project_id: 1, project: { name: "Maison Akwa" } }],
      clients: [{ id: 9, name: "Adjoa", company: "Maison Akwa" }],
    });
    expect(res.quotes).toEqual([]);
    expect(res.projects[0].client_name).toBeNull();
    expect(res.tasks[0].project_name).toBe("Maison Akwa");
    expect(res.clients[0].city).toBeNull();
  });
});

describe("pièces jointes", () => {
  it("n'expose un lien que pour clean et ready, vers attachments", () => {
    expect(attachmentDownloadPath("infected", "12")).toBeNull();
    expect(attachmentDownloadPath("pending", "12")).toBeNull();
    expect(attachmentDownloadPath("scanning", "12")).toBeNull();
    expect(attachmentDownloadPath("clean", "12")).toBe("/v1/attachments/12/download");
    expect(attachmentDownloadPath("ready", "12")).toBe("/v1/attachments/12/download");
  });
});

describe("analytics", () => {
  it("calcule le pipeline ouvert sans endpoint profitability", () => {
    expect(financialFromAnalytics(overview, pipeline)).toEqual({
      activeProjects: 3,
      overdueTasks: 2,
      openPipelineXof: 5000,
      wonXof: 9000,
      revenueXof: 9000,
      cashXof: 0,
      marginRate: 0,
      openQuotesXof: 0,
    });
  });

  it("rédige le bilan depuis overview et pipeline", () => {
    const summary = summaryFromAnalytics(overview, pipeline);
    expect(summary.summary).toContain("3 projets actifs");
    expect(summary.summary).toContain("2 tâches en retard");
    expect(summary.bullets.some((b) => b.includes("Koffi Mensah") && b.includes("6 tâches ouvertes"))).toBe(true);
    expect(summary.scope).toBe("pipeline");
  });

  it("mappe GET /analytics/summary vers un brief cliquable", () => {
    const brief = briefFromWeeklySummary({
      period: { from: "2026-09-29", to: "2026-10-05" },
      source: "gemini",
      kpis: {
        active_projects: 3,
        overdue_tasks: 2,
        completed_tasks_week: 10,
        new_opportunities: 1,
        won_count: 1,
        won_amount: 1940000,
        open_amount: 5000,
        win_rate: 0.5,
        messages: 4,
        active_channels: 2,
      },
      workload: [],
      profitability: {
        won_amount: 9000,
        lost_amount: 0,
        open_amount: 5000,
        won_count: 1,
        lost_count: 0,
        open_count: 2,
        win_rate: 0.5,
        won_amount_30d: 9000,
      },
      chat: { messages: 4, active_channels: 2, available: true },
      headline: "Deux affaires ont avancé",
      narrative: "La semaine a clôturé une opportunité.",
      priorities: [
        "Réassigner ou clôturer les tâches en retard",
        "Relancer les opportunités ouvertes du pipeline",
      ],
    });
    expect(brief.source).toBe("gemini");
    expect(brief.from).toBe("2026-09-29");
    expect(brief.priorities[0]).toEqual({
      label: "Réassigner ou clôturer les tâches en retard",
      href: "/taches",
    });
    expect(brief.priorities[1].href).toBe("/crm/pipeline");
  });

  it("envoie chaque priorité vers le bon écran", () => {
    expect(priorityHref("Réassigner ou clôturer les tâches en retard")).toBe("/taches");
    expect(priorityHref("Relancer les opportunités ouvertes du pipeline")).toBe("/crm/pipeline");
    expect(priorityHref("Rééquilibrer la charge de Koffi")).toBe("/parametres/membres");
    expect(priorityHref("Débloquer le projet Maison Akwa")).toBe("/projets");
    expect(priorityHref("Relancer le canal général")).toBe("/chat");
  });

  it("accorde le bilan au singulier", () => {
    const summary = summaryFromAnalytics(
      { active_projects: 1, overdue_tasks: 0, workload: [{ user_id: 8, name: "Mourchid FOLARIN", open_tasks: 1 }] },
      { by_stage: [] },
    );
    expect(summary.summary).toContain("1 projet actif et 0 tâche en retard");
    expect(summary.bullets.some((b) => b.includes("1 tâche ouverte"))).toBe(true);
  });
});
