import type { Metadata } from "next";
import { getMe, getMyTasks, getProjects } from "@/lib/api/endpoints";
import { groupMyTasks } from "@/lib/domain";
import { firstName, longToday, plural } from "@/lib/format";
import { currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { MyProjects } from "./_components/my-projects";
import { TaskGroup } from "./_components/task-group";
import { ReviewsWidget } from "@/components/contravo/reviews-widget";

export const metadata: Metadata = { title: "Accueil" };

export default async function HomePage() {
  const [me, tasks, projects] = await Promise.all([getMe(), getMyTasks(), getProjects()]);
  const groups = groupMyTasks(tasks);
  // L'API ne renvoie déjà que les projets visibles pour le rôle courant.
  const mine = projects.filter((p) => p.status === "in_progress" || p.status === "on_hold").slice(0, 3);
  const open = groups.overdue.length + groups.today.length + groups.week.length + groups.later.length;
  const canEdit = currentRole(me) !== "guest";

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <header data-reveal className="reveal panel-premium relative mb-9 overflow-hidden rounded-2xl p-5 sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-primary/15 blur-3xl" />
          <p className="relative text-[12px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {longToday()}
          </p>
          <h1 className="title-shine relative mt-2 font-heading text-[clamp(1.75rem,5vw,2.6rem)] leading-tight">
            Bonjour {firstName(me.user.name)}
          </h1>
          <p className="relative mt-2 text-[16px] text-muted-foreground sm:text-[17px]">
            {plural(groups.today.length, "tâche", "tâches")} pour aujourd&apos;hui
            {groups.overdue.length > 0 && (
              <span className="text-danger"> · {groups.overdue.length} en retard</span>
            )}
          </p>
          <ul className="relative mt-5 flex flex-wrap gap-2">
            {[
              { label: "Aujourd'hui", value: groups.today.length },
              { label: "En retard", value: groups.overdue.length, danger: groups.overdue.length > 0 },
              { label: "Cette semaine", value: groups.week.length },
              { label: "Ouvertes", value: open },
            ].map((s) => (
              <li
                key={s.label}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  s.danger
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-border/60 bg-background/50 text-muted-foreground"
                }`}
              >
                <span className="font-semibold tabular-nums text-foreground">{s.value}</span> {s.label}
              </li>
            ))}
          </ul>
        </header>
        {open === 0 ? (
          <EmptyState title="Aucune tâche ouverte">Profitez-en, ou créez-en une avec « Nouvelle tâche ».</EmptyState>
        ) : (
          <>
            <TaskGroup id="en-retard" title="En retard" tasks={groups.overdue} canEdit={canEdit} />
            <TaskGroup id="aujourdhui" title="Aujourd'hui" tasks={groups.today} canEdit={canEdit} />
            <TaskGroup id="cette-semaine" title="Cette semaine" tasks={groups.week} canEdit={canEdit} />
            <TaskGroup id="plus-tard" title="Plus tard" tasks={groups.later} canEdit={canEdit} />
          </>
        )}
      </div>
      <aside data-reveal data-reveal-delay="2" className="reveal space-y-8">
        <MyProjects projects={mine} />
        <ReviewsWidget />
      </aside>
    </div>
  );
}
