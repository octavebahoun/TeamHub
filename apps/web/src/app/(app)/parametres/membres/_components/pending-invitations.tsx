"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelInvitation, resendInvitation } from "@/lib/actions/invitations";
import type { Invitation } from "@/lib/api/types";
import { ago } from "@/lib/format";
import { ROLE } from "@/lib/labels";

export function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="invitations" className="mt-10">
      <h2 id="invitations" className="mb-4 font-heading text-[26px]">Invitations en attente</h2>
      <ul className="divide-y rounded-xl border bg-card">
        {invitations.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-full border border-dashed">
              <Mail className="size-4.5" strokeWidth={1.75} />
            </span>
            <div className="flex-1 leading-tight">
              <p className="font-semibold">{i.email}</p>
              <p className="text-sm text-muted-foreground">
                {ROLE[i.role].label} · envoyée {ago(i.created_at).toLowerCase()}
              </p>
            </div>
            <Button variant="outline" disabled={pending} onClick={() => start(async () => (await resendInvitation(i.id), void toast.success(`Invitation renvoyée à ${i.email}`)))}>
              Renvoyer
            </Button>
            <Button variant="link" className="text-brand-soft-foreground" disabled={pending} onClick={() => start(async () => (await cancelInvitation(i.id), void toast.success("Invitation annulée")))}>
              Annuler<span className="sr-only"> l&apos;invitation de {i.email}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
