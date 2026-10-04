"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/common/field-error";
import { Panel } from "@/components/common/panel";
import { UserAvatar } from "@/components/common/user-avatar";
import { createPost } from "@/lib/actions/social";
import { useFormAction } from "@/hooks/use-form-action";

export function PostComposer({ me, canPin }: { me: string; canPin: boolean }) {
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useFormAction(createPost, {
    successMessage: "Publié dans le fil",
    onSuccess: () => setFormKey((k) => k + 1),
  });
  return (
    <Panel className="p-5">
      <form key={formKey} action={action} className="flex gap-4">
        <UserAvatar name={me} tone="dark" decorative />
        <div className="flex-1 space-y-3">
          <Label htmlFor="post-body" className="sr-only">
            Partager une info avec l&apos;équipe
          </Label>
          <Textarea
            id="post-body"
            name="body"
            rows={2}
            placeholder="Partager une info avec l'équipe…"
            aria-invalid={!!state?.fields?.body || undefined}
          />
          <FieldError message={state?.fields?.body} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" disabled aria-label="Ajouter une image (bientôt disponible)">
              <ImageIcon aria-hidden /> Image
            </Button>
            {canPin && (
              <div className="flex h-10 items-center gap-2.5 rounded-md border px-3">
                <Checkbox id="post-pin" name="pinned" />
                <Label htmlFor="post-pin" className="font-normal">
                  Épingler en annonce
                </Label>
              </div>
            )}
            <Button type="submit" className="ml-auto" disabled={pending}>
              {pending ? "Publication…" : "Publier"}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
