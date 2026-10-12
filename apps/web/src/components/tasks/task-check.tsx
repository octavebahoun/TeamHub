"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTaskDone } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

/** Case « terminée » d'une tâche, avec mise à jour optimiste. */
export function TaskCheck({ id, projectId, done, title, disabled, className }: { id: number; projectId: number; done: boolean; title: string; disabled?: boolean; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [, start] = useTransition();
  return (
    <Checkbox
      checked={optimistic}
      disabled={disabled}
      aria-label={`${optimistic ? "Rouvrir" : "Terminer"} « ${title} »`}
      className={cn("size-6 rounded-md", className)}
      onCheckedChange={(v) =>
        start(async () => {
          setOptimistic(v === true);
          const res = await toggleTaskDone(id, projectId, v === true);
          if (res.error) toast.error(res.error);
          else if (v === true) toast.success("Tâche terminée");
        })
      }
    />
  );
}
