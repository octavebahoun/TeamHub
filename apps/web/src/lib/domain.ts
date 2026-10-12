import { differenceInCalendarDays } from "date-fns";
import type { Client, Opportunity, Project, Task, TaskStatus } from "@/lib/api/types";
import { toDate } from "@/lib/format";

/** Règles métier calculées côté interface à partir des données brutes de l'API. */

export type MyTaskGroups = { overdue: Task[]; today: Task[]; week: Task[]; later: Task[] };

/** Accueil : tâches ouvertes regroupées par échéance (« cette semaine » = les 7 prochains jours). */
export function groupMyTasks(tasks: Task[], now = new Date()): MyTaskGroups {
  const groups: MyTaskGroups = { overdue: [], today: [], week: [], later: [] };
  for (const t of tasks) {
    if (t.status === "done") continue;
    const d = toDate(t.due_date);
    const diff = d ? differenceInCalendarDays(d, now) : null;
    if (diff === null) groups.later.push(t);
    else if (diff < 0) groups.overdue.push(t);
    else if (diff === 0) groups.today.push(t);
    else if (diff <= 7) groups.week.push(t);
    else groups.later.push(t);
  }
  return groups;
}

export type Progress = { done: number; total: number; ratio: number };

export function progressOf(done: number, total: number): Progress {
  return { done, total, ratio: total ? done / total : 0 };
}

/** Progression d'un projet : compteurs de l'API si présents, sinon calcul sur ses tâches. */
export function projectProgress(project: Project, tasks?: Task[]): Progress {
  if (project.tasks_count !== undefined && project.done_tasks_count !== undefined) {
    return progressOf(project.done_tasks_count, project.tasks_count);
  }
  const top = (tasks ?? []).filter((t) => !t.parent_id);
  return progressOf(top.filter((t) => t.status === "done").length, top.length);
}

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const out: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
  for (const t of tasks) if (!t.parent_id) out[t.status]++;
  return out;
}

/** CRM : un contact est « client » s'il a au moins une opportunité gagnée. */
export const clientKind = (opps: Opportunity[]): "client" | "prospect" =>
  opps.some((o) => o.stage === "won") ? "client" : "prospect";

/** Prochaine relance d'un contact : la plus proche parmi ses opportunités ouvertes. */
export function nextFollowUp(opps: Opportunity[]): string | null {
  const open = opps.filter((o) => o.stage !== "won" && o.stage !== "lost" && o.next_follow_up);
  open.sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1));
  return open[0]?.next_follow_up ?? null;
}

export type ContactRow = {
  client: Client;
  kind: "client" | "prospect";
  projects: string[];
  followUp: string | null;
};

export function contactRows(clients: Client[], opps: Opportunity[]): ContactRow[] {
  return clients.map((client) => {
    const mine = opps.filter((o) => o.client_id === client.id);
    return {
      client,
      kind: clientKind(mine),
      projects: [...new Set(mine.map((o) => o.project?.name).filter((n): n is string => !!n))],
      followUp: nextFollowUp(mine),
    };
  });
}

/** Somme des montants d'une liste d'opportunités. */
export const totalAmount = (opps: Opportunity[]) => opps.reduce((s, o) => s + Number(o.amount ?? 0), 0);
