"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectFormFields } from "@/components/projects/project-form-fields";
import { createProject } from "@/lib/actions/projects";
import type { FormState } from "@/lib/actions/session";

export function NewProjectDialog() {
  const [state, action, pending] = useActionState<FormState, FormData>(createProject, undefined);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus aria-hidden /> Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Nouveau projet</DialogTitle>
          <DialogDescription>Vous en serez le responsable ; ajoutez l&apos;équipe ensuite.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-6" noValidate>
          {state?.error && (
            <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">
              {state.error}
            </p>
          )}
          <ProjectFormFields errors={state?.fields} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer le projet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
