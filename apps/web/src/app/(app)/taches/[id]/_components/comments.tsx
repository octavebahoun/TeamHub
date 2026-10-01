"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/common/field-error";
import { Panel, PanelTitle } from "@/components/common/panel";
import { UserAvatar } from "@/components/common/user-avatar";
import { addTaskComment, type TaskFormState } from "@/lib/actions/tasks";
import type { TaskComment } from "@/lib/api/types";
import { ago } from "@/lib/format";

export function Comments({ taskId, comments, me, canComment }: { taskId: number; comments: TaskComment[]; me: string; canComment: boolean }) {
  const [state, action, pending] = useActionState<TaskFormState, FormData>(addTaskComment.bind(null, taskId), undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Commentaires · {comments.length}</PanelTitle>
      <ul className="space-y-5">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-4">
            <UserAvatar name={c.author?.name ?? "?"} decorative />
            <div>
              <p className="text-sm">
                <span className="font-semibold">{c.author?.name}</span> <span className="text-muted-foreground">{ago(c.created_at)}</span>
              </p>
              <p className="mt-0.5">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {canComment && (
        <form ref={form} action={action} className="mt-6 flex gap-4 border-t pt-6">
          <UserAvatar name={me} tone="dark" decorative />
          <div className="flex-1 space-y-3">
            <Label htmlFor="comment" className="sr-only">Écrire un commentaire</Label>
            <Textarea id="comment" name="body" rows={3} placeholder="Écrire un commentaire… (@ pour mentionner)" aria-invalid={!!state?.fields?.body || undefined} />
            <FieldError message={state?.fields?.body ?? state?.error} />
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>{pending ? "Envoi…" : "Envoyer"}</Button>
            </div>
          </div>
        </form>
      )}
    </Panel>
  );
}
