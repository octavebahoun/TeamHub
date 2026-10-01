"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import { Panel, PanelTitle } from "@/components/common/panel";
import { changePassword } from "@/lib/actions/profile";
import { useFormAction } from "@/hooks/use-form-action";

export function PasswordForm() {
  const [state, action, pending] = useFormAction(changePassword, { successMessage: "Mot de passe modifié" });
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Mot de passe</PanelTitle>
      <form action={action} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pw-current" className="font-semibold">Mot de passe actuel</Label>
            <Input id="pw-current" name="current_password" type="password" autoComplete="current-password" className="h-11" required aria-invalid={!!state?.fields?.current_password || undefined} />
            <FieldError message={state?.fields?.current_password} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-new" className="font-semibold">Nouveau mot de passe</Label>
            <Input id="pw-new" name="password" type="password" autoComplete="new-password" minLength={8} className="h-11" required aria-describedby="pw-help" aria-invalid={!!state?.fields?.password || undefined} />
            <p id="pw-help" className="text-sm text-muted-foreground">8 caractères minimum</p>
            <FieldError message={state?.fields?.password} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline" size="lg" disabled={pending}>{pending ? "Modification…" : "Modifier le mot de passe"}</Button>
        </div>
      </form>
    </Panel>
  );
}
