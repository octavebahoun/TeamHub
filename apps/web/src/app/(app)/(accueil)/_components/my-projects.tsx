import Link from "next/link";
import type { Project } from "@/lib/api/types";
import { projectProgress } from "@/lib/domain";
import { PROJECT_STATUS } from "@/lib/labels";
import { Panel } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/progress-bar";
import { EmptyState } from "@/components/common/empty-state";

/** Colonne « Mes projets » : projets actifs avec leur avancement. */
export function MyProjects({ projects }: { projects: Project[] }) {
  return (
    <section aria-labelledby="mes-projets">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="mes-projets" className="font-heading text-[26px]">
          Mes projets
        </h2>
        <Link href="/projets" className="text-primary underline underline-offset-4 hover:text-primary-hover">
          Tout voir
        </Link>
      </div>
      {projects.length === 0 ? (
        <EmptyState title="Aucun projet en cours" className="px-4 py-8">
          Les projets actifs apparaîtront ici. Créez-en un depuis « Projets ».
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {projects.map((p) => {
            const pr = projectProgress(p);
            return (
              <li key={p.id}>
                <Panel as="article" className="relative p-5 transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-sm">
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="truncate font-sans text-[17px] font-semibold">
                      <Link href={`/projets/${p.id}`} className="after:absolute after:inset-0 focus:outline-none">
                        {p.client ? `${p.name} · ${p.client.company ?? p.client.name}` : p.name}
                      </Link>
                    </h3>
                    <span className="shrink-0 text-sm text-muted-foreground">{PROJECT_STATUS[p.status].label}</span>
                  </div>
                  <ProgressBar value={pr.ratio} label={`Avancement de ${p.name}`} />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {pr.done} tâches sur {pr.total} terminées
                  </p>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
