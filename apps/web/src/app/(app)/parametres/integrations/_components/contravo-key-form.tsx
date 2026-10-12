"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveContravoIntegration } from "@/lib/actions/integrations";

export function ContravoKeyForm({
  canManage,
  configured,
  hint,
  billingName,
  billingCity,
  billingEmail,
}: {
  canManage: boolean;
  configured: boolean;
  hint: string | null;
  billingName: string;
  billingCity: string;
  billingEmail: string;
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState(billingName);
  const [city, setCity] = useState(billingCity);
  const [email, setEmail] = useState(billingEmail);
  const [pending, setPending] = useState(false);

  async function save(clearKey = false) {
    setPending(true);
    const res = await saveContravoIntegration({
      apiKey,
      clearKey,
      billingName: name,
      billingCity: city,
      billingEmail: email,
    });
    setPending(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setApiKey("");
    toast.success(clearKey ? "Clé retirée. La facturation reste dans WINE." : "Intégration enregistrée.");
    router.refresh();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canManage) void save(false);
      }}
    >
      <p className="text-sm text-muted-foreground">
        {configured ? `Clé enregistrée pour cet espace (${hint ?? "••••"}).` : "Aucune clé pour cet espace. Devis, contrats et Mobile Money restent dans WINE."}
      </p>
      {canManage ? (
        <>
          <div className="space-y-1">
            <Label htmlFor="contravo-key">Nouvelle clé API</Label>
            <Input
              id="contravo-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={configured ? "Laisser vide pour garder la clé actuelle" : "sk_…"}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="billing-name">Raison sociale</Label>
              <Input id="billing-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="billing-city">Ville</Label>
              <Input id="billing-city" value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="billing-email">E-mail de facturation</Label>
              <Input id="billing-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {configured && (
              <Button type="button" variant="outline" disabled={pending} onClick={() => void save(true)}>
                Retirer la clé
              </Button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Seul le propriétaire de l&apos;espace peut modifier la clé et l&apos;identité de facturation.</p>
      )}
    </form>
  );
}
