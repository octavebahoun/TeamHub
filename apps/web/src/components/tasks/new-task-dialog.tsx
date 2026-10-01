"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/common/native-select";
import { FieldError } from "@/components/common/field-error";
import { createTask, type TaskFormState } from "@/lib/actions/tasks";
import { TASK_PRIORITY } from "@/lib/labels";

export type Option = { id: number; name: string };

/** Création rapide d'une tâche, accessible depuis toutes les pages. */
export function NewTaskDialog({
  projects,
  members,
  defaultProjectId,
  trigger,
}: {
  projects: Option[];
  members: Option[];
  defaultProjectId?: number;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<TaskFormState, FormData>(createTask, undefined);
  const id = useId();

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      toast.success("Tâche créée");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg">
            <Plus aria-hidden /> Nouvelle tâche
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Nouvelle tâche</DialogTitle>
          <DialogDescription>Elle apparaîtra dans le Kanban du projet choisi.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          {state?.error && (
            <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">
              {state.error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-title`}>Titre</Label>
            <Input id={`${id}-title`} name="title" required autoFocus aria-invalid={!!state?.fields?.title} aria-describedby={`${id}-title-err`} />
            <FieldError id={`${id}-title-err`} message={state?.fields?.title} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-project`}>Projet</Label>
              <NativeSelect id={`${id}-project`} name="project_id" defaultValue={defaultProjectId ?? projects[0]?.id} aria-invalid={!!state?.fields?.project_id}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError message={state?.fields?.project_id} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-assignee`}>Assignée à</Label>
              <NativeSelect id={`${id}-assignee`} name="assignee_id" defaultValue="">
                <option value="">Personne</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError message={state?.fields?.assignee_id} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-priority`}>Priorité</Label>
              <NativeSelect id={`${id}-priority`} name="priority" defaultValue="normal">
                {Object.entries(TASK_PRIORITY).map(([value, p]) => (
                  <option key={value} value={value}>
                    {p.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-due`}>Échéance</Label>
              <Input id={`${id}-due`} name="due_date" type="date" aria-invalid={!!state?.fields?.due_date} />
              <FieldError message={state?.fields?.due_date} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-desc`}>Description</Label>
            <Textarea id={`${id}-desc`} name="description" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
