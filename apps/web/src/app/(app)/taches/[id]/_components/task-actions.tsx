"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/common/confirm-button";
import { deleteTask, toggleTaskDone } from "@/lib/actions/tasks";

export function TaskActions({ id, projectId, title, done, canEdit, canDelete }: { id: number; projectId: number; title: string; done: boolean; canEdit: boolean; canDelete: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      {canDelete && (
        <ConfirmButton
          label="Supprimer"
          variant="outline"
          size="lg"
          title={`Supprimer « ${title} » ?`}
          description="La tâche, ses sous-tâches et ses commentaires seront définitivement supprimés."
          confirmLabel="Supprimer"
          onConfirm={async () => {
            await deleteTask(id, projectId);
            router.push(`/taches?projet=${projectId}`);
          }}
        />
      )}
      {canEdit && (
        <Button
          size="lg"
          variant={done ? "outline" : "default"}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await toggleTaskDone(id, projectId, !done);
              if (res.error) toast.error(res.error);
              else toast.success(done ? "Tâche rouverte" : "Tâche terminée");
            })
          }
        >
          {done ? "Rouvrir la tâche" : "Marquer comme terminée"}
        </Button>
      )}
    </>
  );
}
