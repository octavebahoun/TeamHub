"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import { NativeSelect } from "@/components/common/native-select";
import { createOpportunity } from "@/lib/actions/crm";
import { useFormAction } from "@/hooks/use-form-action";
import { OPPORTUNITY_STAGE, STAGE_ORDER } from "@/lib/labels";

export function NewOpportunityDialog({ clients, clientId, variant = "default" }: { clients: { id: number; name: string }[]; clientId?: number; variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useFormAction(createOpportunity, { successMessage: "Opportunité créée", onSuccess: () => setOpen(false), showErrors: false });
  const f = state?.fields ?? {};
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant={variant}>
          {variant === "default" && <Plus aria-hidden />} Nouvelle opportunité
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Nouvelle opportunité</DialogTitle>
          <DialogDescription>Elle rejoint le pipeline à l&apos;étape choisie.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          {state?.error && <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">{state.error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="o-title">Intitulé</Label>
            <Input id="o-title" name="title" required placeholder="Ex. Site vitrine" aria-invalid={!!f.title || undefined} />
            <FieldError message={f.title} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="o-client">Contact</Label>
              <NativeSelect id="o-client" name="client_id" defaultValue={clientId ?? clients[0]?.id} aria-invalid={!!f.client_id || undefined}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
              <FieldError message={f.client_id} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-amount">Montant (FCFA)</Label>
              <Input id="o-amount" name="amount" inputMode="numeric" placeholder="1 200 000" aria-invalid={!!f.amount || undefined} />
              <FieldError message={f.amount} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-stage">Étape</Label>
              <NativeSelect id="o-stage" name="stage" defaultValue="prospect">
                {STAGE_ORDER.map((s) => <option key={s} value={s}>{OPPORTUNITY_STAGE[s].label}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-follow">Prochaine relance</Label>
              <Input id="o-follow" name="next_follow_up" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Création…" : "Créer l'opportunité"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
