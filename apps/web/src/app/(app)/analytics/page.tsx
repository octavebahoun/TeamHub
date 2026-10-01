import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnalyticsOverview, getAnalyticsPipeline, getMe, getProjectTasks, getProjects } from "@/lib/api/endpoints";
import { compactMoney, isOverdue, money, plural } from "@/lib/format";
import { OPPORTUNITY_STAGE, PROJECT_STATUS } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { BarList } from "./_components/bar-list";
import { ColumnChart } from "./_components/column-chart";
import { ExportButton } from "./_components/export-button";
import { KpiTile } from "./_components/kpi-tile";

export const metadata: Metadata = { title: "Analytics" };

const OPEN = ["prospect", "contacted", "proposal"] as const;
const OVERLOAD = 8;

export default async function AnalyticsPage() {
  const me = await getMe();
  if (!can(currentRole(me), "analytics.view")) notFound();
  const [overview, pipeline, projects] = await Promise.all([getAnalyticsOverview(), getAnalyticsPipeline(), getProjects()]);

  // Projets en retard : extension d'API si présente, sinon calcul sur les tâches des projets actifs.
  const late =
    overview.late_projects ??
    (
      await Promise.all(
        projects
          .filter((p) => p.status === "in_progress" || p.status === "on_hold")
          .map(async (p) => ({ id: p.id, name: p.name, overdue: (await getProjectTasks(p.id)).filter((t) => t.status !== "done" && isOverdue(t.due_date)).length }))
      )
    ).filter((p) => p.overdue > 0);

  const stages = OPEN.map((s) => pipeline.by_stage.find((b) => b.stage === s) ?? { stage: s, count: 0, amount: 0 });
  const won = pipeline.by_stage.find((b) => b.stage === "won");
  const openAmount = stages.reduce((sum, s) => sum + s.amount, 0);
  const openCount = stages.reduce((sum, s) => sum + s.count, 0);
  const paused = projects.filter((p) => p.status === "on_hold").length;
  const upcoming = projects.filter((p) => p.status === "upcoming").length;
  const weeks = overview.completed_per_week ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        subtitle={`${me.current_organization?.name ?? ""} · données à jour`}
        actions={
          <ExportButton
            filename="wine-analytics.csv"
            rows={[
              ["Indicateur", "Valeur"],
              ["Projets actifs", overview.active_projects],
              ["Tâches en retard", overview.overdue_tasks],
              ["Pipeline en cours (FCFA)", openAmount],
              ...overview.workload.map((w) => [`Tâches ouvertes · ${w.name}`, w.open_tasks]),
              ...stages.map((s) => [`Pipeline · ${OPPORTUNITY_STAGE[s.stage].label} (FCFA)`, s.amount]),
            ]}
          />
        }
      />
      <section aria-label="Chiffres clés" className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Projets actifs" value={String(overview.active_projects)} hint={`${paused} en pause, ${upcoming} à venir`} />
        <KpiTile
          label="Tâches terminées"
          value={String(overview.completed_tasks ?? weeks.reduce((s, w) => s + w.count, 0))}
          hint="Sur les 30 derniers jours"
        />
        <KpiTile label="Tâches en retard" value={String(overview.overdue_tasks)} hint={plural(late.length, "projet concerné", "projets concernés")} />
        <KpiTile label="Pipeline en cours" value={compactMoney(openAmount)} hint={`FCFA, ${plural(openCount, "opportunité", "opportunités")}`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {weeks.length > 0 && (
          <Panel className="p-7">
            <div className="mb-6 flex items-baseline justify-between">
              <PanelTitle>Tâches terminées par semaine</PanelTitle>
              <span className="text-sm text-muted-foreground">{weeks.reduce((s, w) => s + w.count, 0)} au total</span>
            </div>
            <ColumnChart
              title="Tâches terminées par semaine"
              unit="tâches"
              data={weeks.map((w) => ({ label: w.week, value: w.count }))}
              muted={[weeks[weeks.length - 1].week]}
            />
            <p className="mt-2 text-sm text-muted-foreground">Barre claire : semaine en cours.</p>
          </Panel>
        )}
        <Panel className="p-7">
          <div className="mb-6 flex items-baseline justify-between">
            <PanelTitle>Charge par membre</PanelTitle>
            <span className="text-sm text-muted-foreground">Tâches ouvertes</span>
          </div>
          {overview.workload.length ? (
            <>
              <BarList title="Charge par membre" unit="tâches ouvertes" rows={overview.workload.map((w) => ({ label: w.name, value: w.open_tasks, strong: w.open_tasks > OVERLOAD }))} />
              <p className="mt-2 text-sm text-muted-foreground">Barre foncée : plus de {OVERLOAD} tâches ouvertes, à rééquilibrer.</p>
            </>
          ) : (
            <EmptyState title="Aucune tâche ouverte" />
          )}
        </Panel>
        <Panel className="p-7">
          <div className="mb-6 flex items-baseline justify-between">
            <PanelTitle>Pipeline commercial</PanelTitle>
            <Link href="/crm/pipeline" className="text-primary underline underline-offset-4">Ouvrir le CRM</Link>
          </div>
          <BarList
            title="Pipeline commercial par étape"
            unit="FCFA"
            valueOnTop
            rows={[...stages, ...(won ? [won] : [])].map((s) => ({ label: `${OPPORTUNITY_STAGE[s.stage].label} · ${s.count}`, value: s.amount, display: money(s.amount) }))}
          />
        </Panel>
        <Panel className="p-7">
          <PanelTitle className="mb-4">Projets en retard de tâches</PanelTitle>
          {late.length ? (
            <ul className="divide-y border-t">
              {late.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-4">
                  <Link href={`/projets/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  <ToneBadge tone="brand">{p.overdue} en retard</ToneBadge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Aucun projet en retard">{PROJECT_STATUS.in_progress.label} : tout est dans les temps.</EmptyState>
          )}
        </Panel>
      </div>
    </div>
  );
}
