"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/common/native-select";
import { linkContravoEntity } from "@/lib/actions/contravo";
import { contravoBrowser } from "@/lib/contravo/browser";
import { billingError, contravoContractPayload } from "@/lib/contravo/provision";
import type { Quote } from "@/lib/contravo/types";

export function CreateContractDialog({
  wineProjectId,
  contravoClientId,
  contravoProjectId,
  projectName,
  quotes,
}: {
  wineProjectId: number;
  contravoClientId: string;
  contravoProjectId: string;
  projectName: string;
  quotes: Quote[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Contrat — ${projectName}`);
  const [quoteId, setQuoteId] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    try {
      const contract = await contravoBrowser.createContract(
        contravoContractPayload({
          projectId: contravoProjectId,
          clientId: contravoClientId,
          projectName,
          title,
          quoteId,
        })
      );
      await linkContravoEntity({ type: "contract", id: wineProjectId, contravo_id: contract.id });
      toast.success("Contrat créé.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(billingError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">Créer un contrat</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Nouveau contrat</DialogTitle>
          <DialogDescription>Le contrat est enregistré sur ce projet.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contract-title">Titre</Label>
            <Input id="contract-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {quotes.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="contract-quote">Devis lié</Label>
              <NativeSelect id="contract-quote" value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
                <option value="">Aucun</option>
                {quotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.number}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" disabled={pending} onClick={() => void create()}>
            {pending ? "Création…" : "Créer le contrat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
