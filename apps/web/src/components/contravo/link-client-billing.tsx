"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/common/panel";
import { provisionClient } from "@/lib/actions/billing";

export function LinkClientBilling({ clientId, hasEmail }: { clientId: number; hasEmail: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    const res = await provisionClient(clientId, email);
    setPending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("La fiche de facturation est créée.");
    router.refresh();
  }

  return (
    <Panel className="mb-8 p-7">
      <p className="mb-4">
        {hasEmail
          ? "Ce contact n'est pas encore relié à la facturation. Créez sa fiche pour préparer un devis ou un contrat."
          : "Ce contact n'est pas encore relié à la facturation. Ajoutez un email pour créer sa fiche."}
      </p>
      {!hasEmail && (
        <div className="mb-4 max-w-sm space-y-1.5">
          <Label htmlFor="billing-email">Email</Label>
          <Input id="billing-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
      )}
      <Button type="button" disabled={pending} onClick={() => void run()}>
        {pending ? "Création…" : "Créer la fiche de facturation"}
      </Button>
    </Panel>
  );
}
