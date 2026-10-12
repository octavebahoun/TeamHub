import type { Metadata } from "next";
import { getClients, getMe, getProjects } from "@/lib/api/endpoints";
import type { ProjectStatus } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { FilterChips } from "@/components/common/filter-chips";
import { PageHeader } from "@/components/common/page-header";
import { NewProjectDialog } from "./_components/new-project-dialog";
import { ProjectCard } from "./_components/project-card";

export const metadata: Metadata = { title: "Projets" };

const ORDER: ProjectStatus[] = ["in_progress", "on_hold", "done", "upcoming"];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const me = await getMe();
  const role = currentRole(me);
  const [all, clients] = await Promise.all([getProjects(), can(role, "crm.view") ? getClients() : Promise.resolve([])]);
  const filter = ORDER.includes(statut as ProjectStatus) ? (statut as ProjectStatus) : undefined;
  const shown = filter ? all.filter((p) => p.status === filter) : all;
  const count = (s: ProjectStatus) => all.filter((p) => p.status === s).length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Projets"
        subtitle={`${plural(all.length, "projet", "projets")} · ${count("in_progress")} en cours`}
        actions={can(role, "project.create") && <NewProjectDialog clients={clients.map((c) => ({ id: c.id, label: c.company || c.name }))} />}
      />
      <FilterChips
        label="Filtrer par statut"
        chips={[
          { label: "Tous", count: all.length, href: "/projets", active: !filter },
          ...ORDER.map((s) => ({ label: PROJECT_STATUS[s].filter, count: count(s), href: `/projets?statut=${s}`, active: filter === s })),
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState title="Aucun projet ici">Changez de filtre ou créez un nouveau projet.</EmptyState>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
