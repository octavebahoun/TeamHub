"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/common/native-select";
import { Panel } from "@/components/common/panel";
import { updateTask } from "@/lib/actions/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/lib/api/types";
import { TASK_PRIORITY, TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/labels";

/** Propriétés de la tâche, enregistrées dès qu'un champ change. */
export function TaskProperties({ task, projectName, people, canEdit }: { task: Task; projectName: string; people: { id: number; name: string }[]; canEdit: boolean }) {
  const [pending, start] = useTransition();
  const save = (patch: Parameters<typeof updateTask>[2], label: string) =>
    start(async () => {
      const res = await updateTask(task.id, task.project_id, patch);
      if (res.error) toast.error(res.error);
      else toast.success(`${label} enregistré`);
    });

  return (
    <Panel className="space-y-5 p-6" aria-busy={pending}>
      <h2 className="sr-only">Propriétés</h2>
      <div className="space-y-1.5">
        <Label htmlFor="p-status" className="font-semibold">Statut</Label>
        <NativeSelect id="p-status" defaultValue={task.status} disabled={!canEdit} onChange={(e) => save({ status: e.target.value as TaskStatus }, "Statut")}>
          {TASK_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{TASK_STATUS[s].label}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-assignee" className="font-semibold">Assignée à</Label>
        <NativeSelect id="p-assignee" defaultValue={task.assignee_id ?? ""} disabled={!canEdit} onChange={(e) => save({ assignee_id: e.target.value ? Number(e.target.value) : null }, "Assignation")}>
          <option value="">Personne</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-priority" className="font-semibold">Priorité</Label>
        <NativeSelect id="p-priority" defaultValue={task.priority} disabled={!canEdit} onChange={(e) => save({ priority: e.target.value as TaskPriority }, "Priorité")}>
          {Object.entries(TASK_PRIORITY).map(([v, p]) => (
            <option key={v} value={v}>{p.label}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-due" className="font-semibold">Échéance</Label>
        <Input id="p-due" type="date" defaultValue={task.due_date?.slice(0, 10) ?? ""} disabled={!canEdit} onChange={(e) => save({ due_date: e.target.value || null }, "Échéance")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-project" className="font-semibold">Projet</Label>
        <Input id="p-project" value={projectName} readOnly className="bg-muted" />
      </div>
    </Panel>
  );
}
