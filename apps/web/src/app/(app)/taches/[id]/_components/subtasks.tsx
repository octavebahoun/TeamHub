"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/progress-bar";
import { UserAvatar } from "@/components/common/user-avatar";
import { TaskCheck } from "@/components/tasks/task-check";
import { createTask, type TaskFormState } from "@/lib/actions/tasks";
import type { Task } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function Subtasks({ task, canEdit, canCreate }: { task: Task; canEdit: boolean; canCreate: boolean }) {
  const subs = task.subtasks ?? [];
  const done = subs.filter((s) => s.status === "done").length;
  const [adding, setAdding] = useState(false);
  const [state, action, pending] = useActionState<TaskFormState, FormData>(createTask, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <Panel className="p-7">
      <div className="mb-4 flex items-baseline justify-between">
        <PanelTitle>Sous-tâches</PanelTitle>
        <span className="text-sm text-muted-foreground">{done} sur {subs.length}</span>
      </div>
      {subs.length > 0 && <ProgressBar value={subs.length ? done / subs.length : 0} label="Sous-tâches terminées" className="mb-2" />}
      <ul className="divide-y">
        {subs.map((s) => (
          <li key={s.id} className="flex items-center gap-4 py-3.5">
            <TaskCheck id={s.id} projectId={s.project_id} done={s.status === "done"} title={s.title} disabled={!canEdit} />
            <span className={cn("flex-1", s.status === "done" && "text-muted-foreground line-through")}>{s.title}</span>
            {s.assignee && <UserAvatar name={s.assignee.name} size="sm" />}
          </li>
        ))}
      </ul>
      {canCreate &&
        (adding ? (
          <form ref={form} action={action} className="mt-3 flex gap-2">
            <input type="hidden" name="project_id" value={task.project_id} />
            <input type="hidden" name="parent_id" value={task.id} />
            <label htmlFor="new-subtask" className="sr-only">Nouvelle sous-tâche</label>
            <Input id="new-subtask" name="title" autoFocus placeholder="Nouvelle sous-tâche" required aria-invalid={!!state?.fields?.title || undefined} />
            <Button type="submit" disabled={pending}>Ajouter</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>Fermer</Button>
          </form>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-dashed px-4 text-muted-foreground hover:border-primary hover:text-primary">
            <Plus aria-hidden className="size-4" /> Ajouter une sous-tâche
          </button>
        ))}
    </Panel>
  );
}
