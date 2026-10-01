"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import { NativeSelect } from "@/components/common/native-select";
import { inviteMember } from "@/lib/actions/invitations";
import { useFormAction } from "@/hooks/use-form-action";
import { ASSIGNABLE_ROLES, ROLE } from "@/lib/labels";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useFormAction(inviteMember, { successMessage: "Invitation créée", onSuccess: () => setOpen(false), showErrors: false });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus aria-hidden /> Inviter un membre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Inviter un membre</DialogTitle>
          <DialogDescription>L&apos;invitation est valable 7 jours.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          {state?.error && <p role="alert" className="rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">{state.error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">Email</Label>
            <Input id="inv-email" name="email" type="email" required autoComplete="off" defaultValue={state?.values?.email} aria-invalid={!!state?.fields?.email || undefined} />
            <FieldError message={state?.fields?.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-role">Rôle</Label>
            <NativeSelect id="inv-role" name="role" defaultValue={state?.values?.role ?? "member"} aria-describedby="inv-role-help">
              {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE[r].label}</option>)}
            </NativeSelect>
            <p id="inv-role-help" className="text-sm text-muted-foreground">Vous pourrez changer le rôle plus tard.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Envoi…" : "Envoyer l'invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
