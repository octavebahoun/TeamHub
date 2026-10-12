"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ProjectFormFields } from "@/components/projects/project-form-fields";
import { ConfirmButton } from "@/components/common/confirm-button";
import { archiveProject, updateProject } from "@/lib/actions/projects";
import { useFormAction } from "@/hooks/use-form-action";
import type { Project } from "@/lib/api/types";

export function EditProjectDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useFormAction(updateProject.bind(null, project.id), { successMessage: "Projet mis à jour", onSuccess: () => setOpen(false), showErrors: false });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Modifier le projet</DialogTitle>
          <DialogDescription>{project.name}</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-6" noValidate>
          {state?.error && (
            <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">
              {state.error}
            </p>
          )}
          <ProjectFormFields project={project} errors={state?.fields} />
          <DialogFooter className="sm:justify-between">
            <ConfirmButton
              label="Archiver"
              title={`Archiver « ${project.name} » ?`}
              description="Le projet disparaîtra des listes. Ses tâches sont conservées."
              confirmLabel="Archiver"
              onConfirm={() => archiveProject(project.id)}
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
