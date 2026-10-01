import Link from "next/link";
import type { Task } from "@/lib/api/types";
import { dueLabel, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/common/section-label";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TaskCheck } from "@/components/tasks/task-check";

/** Groupe de tâches de l'Accueil (« En retard », « Aujourd'hui »…). */
export function TaskGroup({ id, title, tasks, canEdit }: { id: string; title: string; tasks: Task[]; canEdit: boolean }) {
  if (tasks.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mb-9">
      <SectionLabel id={id} count={tasks.length}>
        {title}
      </SectionLabel>
      <ul className="divide-y rounded-xl border bg-card">
        {tasks.map((t) => {
          const late = isOverdue(t.due_date);
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
              <TaskCheck id={t.id} projectId={t.project_id} done={t.status === "done"} title={t.title} disabled={!canEdit} />
              <div className="min-w-0 flex-1">
                <Link href={`/taches/${t.id}`} className="font-medium hover:underline">
                  {t.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">{t.project?.name}</p>
              </div>
              <span className="hidden sm:inline-flex">
                <PriorityBadge priority={t.priority} />
              </span>
              <p className={cn("shrink-0 text-right text-[15px] sm:w-28", late ? "font-semibold text-danger" : "text-muted-foreground")}>
                {late && <span className="sr-only">En retard, échéance </span>}
                {dueLabel(t.due_date)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
