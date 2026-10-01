import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getMe, getMembers, getProject, getProjectActivity, getProjectTasks } from "@/lib/api/endpoints";
import { countByStatus, projectProgress } from "@/lib/domain";
import { shortDate } from "@/lib/format";
import { PROJECT_STATUS, ROLE } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { EditProjectDialog } from "./_components/edit-project-dialog";
import { FilesPanel } from "@/components/common/files-panel";
import { Milestones } from "./_components/milestones";
import { ProgressPanel } from "./_components/progress-panel";
import { ProjectTabs } from "./_components/project-tabs";
import { RecentActivity } from "./_components/recent-activity";
import { TeamPanel } from "./_components/team-panel";

type Props = { params: Promise<{ id: string }> };

async function load(id: number) {
  try {
    return await getProject(id);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await load(Number((await params).id));
  return { title: project.name };
}

export default async function ProjectPage({ params }: Props) {
  const id = Number((await params).id);
  const [project, tasks, activity, me] = await Promise.all([load(id), getProjectTasks(id), getProjectActivity(id), getMe()]);
  const role = currentRole(me);
  const members = can(role, "members.view") ? await getMembers() : [];
  const progress = projectProgress(project, tasks);
  const canManage = can(role, "member.manage") || project.owner_id === me.user.id;
  const status = PROJECT_STATUS[project.status];
  const team = (project.members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    detail: m.id === project.owner_id ? "Responsable" : ROLE[members.find((x) => x.user_id === m.id)?.role ?? "member"].label,
  }));
  const files = project.attachments ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        crumbs={[{ label: "Projets", href: "/projets" }, { label: project.name }]}
        title={project.name}
        badge={<ToneBadge tone={status.tone}>{status.label}</ToneBadge>}
        subtitle={[
          project.client ? `Client : ${project.client.company ?? project.client.name}` : "Produit interne",
          project.owner && `Responsable ${project.owner.name}`,
          project.end_date && `Échéance ${shortDate(project.end_date)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            {canManage && <EditProjectDialog project={project} />}
            <Link href={`/taches?projet=${project.id}`} className={buttonVariants({ size: "lg" })}>
              Ouvrir le Kanban
            </Link>
          </>
        }
      />
      <ProjectTabs
        tabs={[
          { label: "Vue d'ensemble", href: `/projets/${id}`, current: true },
          { label: `Tâches · ${progress.total}`, href: `/taches?projet=${id}` },
          { label: `Fichiers · ${files.length}`, href: `/projets/${id}#fichiers` },
          { label: "Canal du projet", href: `/chat?projet=${id}` },
        ]}
      />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-8">
          <Panel className="p-7">
            <PanelTitle className="mb-4">Description</PanelTitle>
            <p className="leading-relaxed">{project.description || <span className="text-muted-foreground">Pas encore de description.</span>}</p>
          </Panel>
          {project.milestones && project.milestones.length > 0 && <Milestones items={project.milestones} />}
          {activity.length > 0 && <RecentActivity items={activity} />}
        </div>
        <div className="space-y-8">
          <ProgressPanel progress={progress} counts={countByStatus(tasks)} />
          <TeamPanel
            projectId={id}
            ownerId={project.owner_id}
            team={team}
            canManage={canManage}
            candidates={members.filter((m) => !team.some((t) => t.id === m.user_id)).map((m) => ({ id: m.user_id, name: m.name }))}
          />
          {files.length > 0 && <FilesPanel files={files} />}
        </div>
      </div>
    </div>
  );
}
