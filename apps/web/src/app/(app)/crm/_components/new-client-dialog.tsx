"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import { createClient } from "@/lib/actions/crm";
import type { FormState } from "@/lib/actions/session";

const FIELDS = [
  { name: "company", label: "Entreprise", autoComplete: "organization" },
  { name: "name", label: "Contact principal", autoComplete: "name", required: true },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Téléphone", type: "tel", autoComplete: "tel" },
  { name: "address", label: "Adresse", autoComplete: "street-address" },
];

export function NewClientDialog() {
  const [state, action, pending] = useActionState<FormState, FormData>(createClient, undefined);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus aria-hidden /> Nouveau contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Nouveau contact</DialogTitle>
          <DialogDescription>Un prospect ou un client de l&apos;organisation.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          {state?.error && <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">{state.error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={`c-${f.name}`}>{f.label}</Label>
                <Input id={`c-${f.name}`} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required={f.required} aria-invalid={!!state?.fields?.[f.name] || undefined} />
                <FieldError message={state?.fields?.[f.name]} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Création…" : "Créer le contact"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
