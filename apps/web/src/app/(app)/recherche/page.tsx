import type { Metadata } from "next";
import Link from "next/link";
import { getClients, getMe, getProjectTasks, getProjects } from "@/lib/api/endpoints";
import { plural } from "@/lib/format";
import { PROJECT_STATUS, TASK_STATUS } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SectionLabel } from "@/components/common/section-label";

export const metadata: Metadata = { title: "Recherche" };

const match = (q: string, ...values: (string | null | undefined)[]) => values.some((v) => v?.toLowerCase().includes(q));

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  if (!q) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Recherche" subtitle="Tapez un mot dans la barre du haut : projet, tâche ou client." />
      </div>
    );
  }
  const needle = q.toLowerCase();
  const me = await getMe();
  const projects = (await getProjects()).filter((p) => !p.archived_at);
  const [taskLists, clients] = await Promise.all([
    Promise.all(projects.slice(0, 12).map((p) => getProjectTasks(p.id).then((ts) => ts.map((t) => ({ ...t, projectName: p.name }))))),
    can(currentRole(me), "crm.view") ? getClients(q) : Promise.resolve([]),
  ]);
  const foundProjects = projects.filter((p) => match(needle, p.name, p.description, p.client?.company));
  const foundTasks = taskLists.flat().filter((t) => match(needle, t.title, t.description)).slice(0, 30);
  const total = foundProjects.length + foundTasks.length + clients.length;

  const group = (id: string, title: string, items: { key: string | number; href: string; label: string; meta: string }[]) =>
    items.length > 0 && (
      <section aria-labelledby={id} className="mb-9">
        <SectionLabel id={id} count={items.length}>{title}</SectionLabel>
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted">
                <span className="font-medium">{i.label}</span>
                <span className="text-sm text-muted-foreground">{i.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={`Résultats pour « ${q} »`} subtitle={plural(total, "résultat", "résultats")} />
      {total === 0 ? (
        <EmptyState title="Rien trouvé">Essayez un autre mot, ou vérifiez l&apos;orthographe.</EmptyState>
      ) : (
        <>
          {group("r-projets", "Projets", foundProjects.map((p) => ({ key: p.id, href: `/projets/${p.id}`, label: p.name, meta: PROJECT_STATUS[p.status].label })))}
          {group("r-taches", "Tâches", foundTasks.map((t) => ({ key: t.id, href: `/taches/${t.id}`, label: t.title, meta: `${t.projectName} · ${TASK_STATUS[t.status].label}` })))}
          {group("r-clients", "Clients", clients.map((c) => ({ key: c.id, href: `/crm/${c.id}`, label: c.company ?? c.name, meta: c.company ? c.name : c.email ?? "" })))}
        </>
      )}
    </div>
  );
}
