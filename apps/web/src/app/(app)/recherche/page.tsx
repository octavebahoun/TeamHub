import type { Metadata } from "next";
import Link from "next/link";
import { searchWine } from "@/lib/actions/search";
import { plural } from "@/lib/format";
import { PROJECT_STATUS, TASK_STATUS } from "@/lib/labels";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SectionLabel } from "@/components/common/section-label";

export const metadata: Metadata = { title: "Recherche" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  if (!q) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Recherche" subtitle="Tapez un mot dans la barre du haut : projet, tâche ou client." />
      </div>
    );
  }
  const results = await searchWine(q);
  const foundProjects = results.projects;
  const foundTasks = results.tasks;
  const clients = results.clients;
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
          {group("r-taches", "Tâches", foundTasks.map((t) => ({ key: t.id, href: `/taches/${t.id}`, label: t.title, meta: `${t.project_name} · ${TASK_STATUS[t.status].label}` })))}
          {group("r-clients", "Clients", clients.map((c) => ({ key: c.id, href: `/crm/${c.id}`, label: c.company ?? c.name, meta: c.city ?? c.name })))}
        </>
      )}
    </div>
  );
}
