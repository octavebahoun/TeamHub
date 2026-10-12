"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { TASK_STATUS } from "@/lib/labels";
import { updateTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import { NewTaskDialog, type Option } from "@/components/tasks/new-task-dialog";
import { TaskCard } from "./task-card";

type Props = {
  tasks: Task[];
  columns: TaskStatus[];
  projectId: number;
  /** Tâches que l'utilisateur courant a le droit de déplacer (calculé côté serveur). */
  movable: number[];
  createOptions: { projects: Option[]; members: Option[] } | null;
};

/** Plateau Kanban : glisser-déposer entre colonnes avec mise à jour optimiste. */
export function KanbanBoard({ tasks, columns, projectId, movable, createOptions }: Props) {
  const [optimistic, move] = useOptimistic(tasks, (state, { id, status }: { id: number; status: TaskStatus }) =>
    state.map((t) => (t.id === id ? { ...t, status } : t))
  );
  const [, start] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  const moveTask = (id: number, status: TaskStatus) =>
    start(async () => {
      move({ id, status });
      const res = await updateTask(id, projectId, { status });
      if (res.error) toast.error(res.error);
      else toast.success(`Tâche déplacée vers « ${TASK_STATUS[status].label} »`);
    });

  return (
    <div className={cn("grid gap-5", columns.length > 1 ? "md:grid-cols-2 xl:grid-cols-4" : "")}>
      {columns.map((status) => {
        const items = optimistic.filter((t) => t.status === status);
        return (
          <section
            key={status}
            aria-labelledby={`col-${status}`}
            onDragOver={(e) => {
              if (dragId === null) return;
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((o) => (o === status ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              const id = Number(e.dataTransfer.getData("text/plain"));
              setOver(null);
              const t = optimistic.find((x) => x.id === id);
              if (t && t.status !== status) moveTask(id, status);
            }}
            className={cn("flex flex-col rounded-2xl border bg-muted p-4 transition-colors", over === status && "border-primary bg-brand-soft/40")}
          >
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 id={`col-${status}`} className="flex items-center gap-2.5 font-sans text-[17px] font-semibold">
                <span aria-hidden className={cn("size-2.5 rounded-full", TASK_STATUS[status].dot)} />
                {TASK_STATUS[status].label}
                <span aria-hidden className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border bg-background px-2 text-sm font-medium">
                  {items.length}
                </span>
                <span className="sr-only"> {plural(items.length, "tâche", "tâches")}</span>
              </h2>
            </div>
            <ul className={cn("grid gap-3", columns.length === 1 && "sm:grid-cols-2 xl:grid-cols-3")}>
              {items.map((t) => (
                <li key={t.id}>
                  <TaskCard
                    task={t}
                    canMove={movable.includes(t.id)}
                    onMove={(s) => moveTask(t.id, s)}
                    dragging={dragId === t.id}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                  />
                </li>
              ))}
            </ul>
            {createOptions && (
              <NewTaskDialog
                projects={createOptions.projects}
                members={createOptions.members}
                defaultProjectId={projectId}
                trigger={
                  <button type="button" className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
                    <Plus aria-hidden className="size-4" /> Ajouter une tâche
                  </button>
                }
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
