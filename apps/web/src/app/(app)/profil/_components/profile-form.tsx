"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import { Panel, PanelTitle } from "@/components/common/panel";
import { updateProfile } from "@/lib/actions/profile";
import { useFormAction } from "@/hooks/use-form-action";
import type { User } from "@/lib/api/types";

const Field = ({ id, label, error, ...input }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="font-semibold">{label}</Label>
    <Input id={id} className="h-11" aria-invalid={!!error || undefined} {...input} />
    <FieldError message={error} />
  </div>
);

export function ProfileForm({ user }: { user: User }) {
  const [state, action, pending] = useFormAction(updateProfile, { successMessage: "Profil enregistré" });
  const f = state?.fields ?? {};
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Informations</PanelTitle>
      <form action={action} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="pf-name" name="name" label="Nom complet" autoComplete="name" defaultValue={user.name} required error={f.name} />
          <Field id="pf-title" name="title" label="Poste" autoComplete="organization-title" defaultValue={user.title ?? ""} error={f.title} />
          <Field id="pf-email" name="email" type="email" label="Email" autoComplete="email" defaultValue={user.email} required error={f.email} />
          <Field id="pf-phone" name="phone" type="tel" label="Téléphone" autoComplete="tel" placeholder="+229 …" defaultValue={user.phone ?? ""} error={f.phone} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
        </div>
      </form>
    </Panel>
  );
}
