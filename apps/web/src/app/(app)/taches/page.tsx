import type { Metadata } from "next";
import { Suspense } from "react";
import { getMe, getMembers, getProject, getProjects, getProjectTasks } from "@/lib/api/endpoints";
import type { Task, TaskPriority, TaskStatus } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { FilterChips } from "@/components/common/filter-chips";
import { PageHeader } from "@/components/common/page-header";
import { KanbanBoard } from "./_components/kanban-board";
import { TaskFilters } from "./_components/task-filters";
import { TaskTable } from "./_components/task-table";
import { ViewToggle } from "./_components/view-toggle";

export const metadata: Metadata = { title: "Tâches" };

type Search = { projet?: string; etape?: string; personne?: string; priorite?: string; vue?: string };

export default async function TasksPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [me, projects] = await Promise.all([getMe(), getProjects()]);
  const role = currentRole(me);
  const active = projects.filter((p) => !p.archived_at);
  const project = active.find((p) => p.id === Number(sp.projet)) ?? active.find((p) => p.status === "in_progress") ?? active[0];

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Tâches" />
        <EmptyState title="Aucun projet pour l'instant">Créez un projet pour y ajouter des tâches.</EmptyState>
      </div>
    );
  }

  const [all, members, detail] = await Promise.all([
    getProjectTasks(project.id),
    can(role, "members.view") ? getMembers() : Promise.resolve([]),
    getProject(project.id),
  ]);
  const top = all.filter((t) => !t.parent_id);
  const stage = TASK_STATUS_ORDER.includes(sp.etape as TaskStatus) ? (sp.etape as TaskStatus) : undefined;
  const view = sp.vue === "liste" ? "liste" : "kanban";
  const filtered = top.filter(
    (t) => (!sp.personne || t.assignee_id === Number(sp.personne)) && (!sp.priorite || t.priority === (sp.priorite as TaskPriority))
  );
  const shown = stage ? filtered.filter((t) => t.status === stage) : filtered;

  const href = (patch: Partial<Search>) => {
    const q = new URLSearchParams(Object.entries({ ...sp, projet: String(project.id), ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/taches?${q}`;
  };
  const isLead = ["owner", "admin"].includes(role) || (role === "manager" && (project.owner_id === me.user.id || project.members?.some((m) => m.id === me.user.id)));
  const canMoveTask = (t: Task) => role !== "guest" && (isLead || t.assignee_id === me.user.id || t.created_by === me.user.id);
  const current = detail.milestones?.find((m) => m.current);
  const people = (project.members ?? []).map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        crumbs={[{ label: "Projets", href: "/projets" }, { label: project.name, href: `/projets/${project.id}` }, { label: "Tâches" }]}
        title="Tâches"
        subtitle={[project.name, plural(top.length, "tâche", "tâches"), current && `Jalon ${current.code} en cours`].filter(Boolean).join(" · ")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle view={view} hrefFor={(v) => href({ vue: v === "liste" ? "liste" : undefined })} />
            <Suspense>
              <TaskFilters projects={active.map((p) => ({ id: p.id, name: p.name }))} people={people} />
            </Suspense>
          </div>
        }
      />
      <FilterChips
        label="Filtrer par étape"
        chips={[
          { label: "Toutes", count: filtered.length, href: href({ etape: undefined }), active: !stage },
          ...TASK_STATUS_ORDER.map((s) => ({ label: TASK_STATUS[s].label, count: filtered.filter((t) => t.status === s).length, href: href({ etape: s }), active: stage === s })),
        ]}
      />
      {view === "liste" ? (
        shown.length ? <TaskTable tasks={shown} /> : <EmptyState title="Aucune tâche ne correspond aux filtres" />
      ) : (
        <KanbanBoard
          tasks={shown}
          columns={stage ? [stage] : TASK_STATUS_ORDER}
          projectId={project.id}
          movable={shown.filter(canMoveTask).map((t) => t.id)}
          createOptions={
            can(role, "task.create")
              ? { projects: active.map((p) => ({ id: p.id, name: p.name })), members: members.map((m) => ({ id: m.user_id, name: m.name })) }
              : null
          }
        />
      )}
    </div>
  );
}
