import Link from "next/link";
import type { Task } from "@/lib/api/types";
import { dueLabel, isOverdue } from "@/lib/format";
import { TASK_STATUS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/user-avatar";
import { PriorityBadge } from "@/components/tasks/priority-badge";

/** Vue liste des tâches (tableau sémantique). */
export function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[720px] text-left">
        <caption className="sr-only">Tâches du projet</caption>
        <thead className="border-b text-[13px] tracking-[0.1em] uppercase">
          <tr>
            <th scope="col" className="px-5 py-3.5 font-semibold">Tâche</th>
            <th scope="col" className="px-5 py-3.5 font-semibold">Statut</th>
            <th scope="col" className="px-5 py-3.5 font-semibold">Priorité</th>
            <th scope="col" className="px-5 py-3.5 font-semibold">Assignée</th>
            <th scope="col" className="px-5 py-3.5 font-semibold">Échéance</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-muted/60">
              <td className="px-5 py-3.5 font-medium">
                <Link href={`/taches/${t.id}`} className="hover:underline">
                  {t.title}
                </Link>
              </td>
              <td className="px-5 py-3.5">
                <span className="flex items-center gap-2">
                  <span aria-hidden className={cn("size-2.5 rounded-full", TASK_STATUS[t.status].dot)} />
                  {TASK_STATUS[t.status].label}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-5 py-3.5">
                {t.assignee ? (
                  <span className="flex items-center gap-2">
                    <UserAvatar name={t.assignee.name} size="xs" tone="dark" decorative />
                    {t.assignee.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className={cn("px-5 py-3.5", t.status !== "done" && isOverdue(t.due_date) ? "font-semibold text-danger" : "text-muted-foreground")}>
                {t.due_date ? dueLabel(t.due_date) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
