import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getMe, getProject, getTask } from "@/lib/api/endpoints";
import { ago, shortDate } from "@/lib/format";
import { can, currentRole } from "@/lib/permissions";
import { PageHeader } from "@/components/common/page-header";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TASK_STATUS } from "@/lib/labels";
import { Comments } from "./_components/comments";
import { Subtasks } from "./_components/subtasks";
import { TaskActions } from "./_components/task-actions";
import { TaskProperties } from "./_components/task-properties";
import { FilesPanel } from "@/components/common/files-panel";

type Props = { params: Promise<{ id: string }> };

async function load(id: number) {
  try {
    return await getTask(id);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await load(Number((await params).id))).title };
}

export default async function TaskPage({ params }: Props) {
  const task = await load(Number((await params).id));
  const [project, me] = await Promise.all([getProject(task.project_id), getMe()]);
  const role = currentRole(me);
  const lead = ["owner", "admin"].includes(role) || (role === "manager" && (project.owner_id === me.user.id || !!project.members?.some((m) => m.id === me.user.id)));
  const canEdit = role !== "guest" && (lead || task.assignee_id === me.user.id || task.created_by === me.user.id);
  const done = task.status === "done";

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        crumbs={[
          { label: "Projets", href: "/projets" },
          { label: project.name, href: `/projets/${project.id}` },
          { label: "Tâches", href: `/taches?projet=${project.id}` },
          { label: task.title },
        ]}
        title={task.title}
        subtitle={
          <>
            <span className="mb-3 flex flex-wrap gap-2" aria-label="Étiquettes">
              <ToneBadge tone={done ? "success" : "neutral"}>{TASK_STATUS[task.status].label}</ToneBadge>
              <PriorityBadge priority={task.priority} />
            </span>
            {task.creator ? `Créée par ${task.creator.name} le ${shortDate(task.created_at)}` : `Créée le ${shortDate(task.created_at)}`} · Modifiée{" "}
            {ago(task.updated_at).toLowerCase()}
          </>
        }
        actions={<TaskActions id={task.id} projectId={project.id} title={task.title} done={done} canEdit={canEdit} canDelete={lead} />}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-8">
          <Panel className="p-7">
            <PanelTitle className="mb-4">Description</PanelTitle>
            <p className="leading-relaxed whitespace-pre-line">{task.description || <span className="text-muted-foreground">Pas de description.</span>}</p>
          </Panel>
          <Subtasks task={task} canEdit={canEdit} canCreate={can(role, "task.create")} />
          <Comments taskId={task.id} comments={task.comments ?? []} me={me.user.name} canComment={role !== "guest"} />
        </div>
        <div className="space-y-8">
          <TaskProperties task={task} projectName={project.name} people={(project.members ?? []).map((m) => ({ id: m.id, name: m.name }))} canEdit={canEdit} />
          {task.attachments && task.attachments.length > 0 && <FilesPanel files={task.attachments} title="Pièces jointes" />}
        </div>
      </div>
    </div>
  );
}
