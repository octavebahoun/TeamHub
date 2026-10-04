import { describe, expect, it } from "vitest";
import type { Opportunity, Project, Task } from "@/lib/api/types";
import { clientKind, contactRows, countByStatus, groupMyTasks, nextFollowUp, projectProgress, sortSocialFeed } from "@/lib/domain";

const NOW = new Date("2026-10-01T09:00:00");
const task = (o: Partial<Task>): Task =>
  ({ id: 1, project_id: 1, parent_id: null, status: "todo", priority: "normal", due_date: null, title: "t", ...o }) as Task;
const opp = (o: Partial<Opportunity>): Opportunity =>
  ({ id: 1, client_id: 1, stage: "prospect", next_follow_up: null, amount: "0", title: "o", ...o }) as Opportunity;

describe("groupMyTasks", () => {
  it("range les tâches ouvertes par échéance et ignore les terminées", () => {
    const g = groupMyTasks(
      [
        task({ id: 1, due_date: "2026-09-30" }),
        task({ id: 2, due_date: "2026-10-01" }),
        task({ id: 3, due_date: "2026-10-05" }),
        task({ id: 4, due_date: "2026-10-20" }),
        task({ id: 5 }),
        task({ id: 6, due_date: "2026-09-01", status: "done" }),
      ],
      NOW
    );
    expect(g.overdue.map((t) => t.id)).toEqual([1]);
    expect(g.today.map((t) => t.id)).toEqual([2]);
    expect(g.week.map((t) => t.id)).toEqual([3]);
    expect(g.later.map((t) => t.id)).toEqual([4, 5]);
  });
});

describe("projectProgress / countByStatus", () => {
  it("utilise les compteurs de l'API quand ils existent", () => {
    expect(projectProgress({ tasks_count: 30, done_tasks_count: 12 } as Project)).toEqual({ done: 12, total: 30, ratio: 0.4 });
  });
  it("sinon calcule sur les tâches racines (hors sous-tâches)", () => {
    const tasks = [task({ status: "done" }), task({}), task({ parent_id: 1, status: "done" })];
    expect(projectProgress({} as Project, tasks)).toEqual({ done: 1, total: 2, ratio: 0.5 });
    expect(countByStatus(tasks)).toEqual({ todo: 1, in_progress: 0, review: 0, done: 1 });
  });
  it("ne divise pas par zéro", () => {
    expect(projectProgress({} as Project, []).ratio).toBe(0);
  });
});

describe("CRM", () => {
  it("un contact devient client dès une opportunité gagnée", () => {
    expect(clientKind([opp({ stage: "proposal" })])).toBe("prospect");
    expect(clientKind([opp({ stage: "proposal" }), opp({ stage: "won" })])).toBe("client");
  });
  it("la prochaine relance ignore les opportunités closes", () => {
    const opps = [
      opp({ stage: "won", next_follow_up: "2026-09-01" }),
      opp({ stage: "contacted", next_follow_up: "2026-10-12" }),
      opp({ stage: "proposal", next_follow_up: "2026-10-03" }),
    ];
    expect(nextFollowUp(opps)).toBe("2026-10-03");
  });
  it("contactRows agrège projets et relances par contact", () => {
    const rows = contactRows(
      [{ id: 1, name: "Paul" } as never, { id: 2, name: "Afi" } as never],
      [opp({ client_id: 1, stage: "won", project: { id: 9, name: "Site vitrine" } }), opp({ client_id: 2, next_follow_up: "2026-10-03" })]
    );
    expect(rows.map((r) => [r.kind, r.projects, r.followUp])).toEqual([
      ["client", ["Site vitrine"], null],
      ["prospect", [], "2026-10-03"],
    ]);
  });
});

describe("sortSocialFeed", () => {
  it("place les plus récentes en haut et les épinglées au-dessus", () => {
    const feed = sortSocialFeed([
      { id: 1, pinned: false, pinned_at: null, created_at: "2026-01-01T10:00:00Z" },
      { id: 2, pinned: false, pinned_at: null, created_at: "2026-10-04T18:00:00Z" },
      { id: 3, pinned: true, pinned_at: "2026-09-01T08:00:00Z", created_at: "2026-08-01T08:00:00Z" },
    ]);
    expect(feed.map((p) => p.id)).toEqual([3, 2, 1]);
  });
});
