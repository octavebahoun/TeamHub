import { describe, expect, it } from "vitest";
import type { AnalyticsOverview, AnalyticsPipeline } from "@/lib/api/types";
import {
  MARK_ALL_NOTIFICATIONS_PATH,
  attachmentDownloadPath,
  financialFromAnalytics,
  mapInboxList,
  mapWineSearch,
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
    });
  });

  it("rédige le bilan depuis overview et pipeline", () => {
    const summary = summaryFromAnalytics(overview, pipeline);
    expect(summary.summary).toContain("3 projets actifs");
    expect(summary.summary).toContain("2 tâches en retard");
    expect(summary.bullets.some((b) => b.includes("Koffi Mensah") && b.includes("6 tâches ouvertes"))).toBe(true);
    expect(summary.scope).toBe("pipeline");
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
