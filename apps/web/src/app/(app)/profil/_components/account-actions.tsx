"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/common/confirm-button";
import { deleteAccount } from "@/lib/actions/profile";
import { logout } from "@/lib/actions/session";

export function AccountActions() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <form action={logout}>
        <Button type="submit" variant="outline" size="lg">Se déconnecter</Button>
      </form>
      <ConfirmButton
        label="Supprimer mon compte"
        variant="link"
        className="text-brand-soft-foreground underline"
        title="Supprimer votre compte ?"
        description="Votre compte et vos accès seront supprimés. Les tâches et messages restent dans les organisations."
        confirmLabel="Supprimer définitivement"
        onConfirm={async () => {
          const res = await deleteAccount();
          if (res?.error) toast.error(res.error);
        }}
      />
    </div>
  );
}
