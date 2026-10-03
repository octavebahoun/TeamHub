"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { FileDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkContravoEntity } from "@/lib/actions/contravo";
import { money } from "@/lib/format";
import { contravoBrowser } from "@/lib/contravo/browser";
import type { QuoteLineItemInput } from "@/lib/contravo/types";

type Line = { id: string; description: string; quantity: string; unitPrice: string };

const emptyLine = (): Line => ({ id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" });

function parseAmount(raw: string): number {
  const n = Number(String(raw).replace(/\s/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function previewTotals(lines: Line[], discountFcfa: number, taxRateBps: number) {
  const subtotal = lines.reduce((s, l) => s + parseAmount(l.unitPrice) * (Number(l.quantity) || 1), 0);
  const afterDisc = Math.max(0, subtotal - discountFcfa);
  const tax = Math.round((afterDisc * taxRateBps) / 10000);
  return { subtotal, afterDisc, tax, total: afterDisc + tax };
}

export function GenerateQuoteDialog({
  contravoClientId,
  contravoProjectId,
  opportunityId,
  defaultTitle,
  triggerLabel = "Générer devis express",
}: {
  contravoClientId: string;
  contravoProjectId: string;
  opportunityId?: number;
  defaultTitle?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { id: "1", description: defaultTitle ?? "Prestation", quantity: "1", unitPrice: "1500000" },
  ]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("18");
  const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [pending, setPending] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const taxRateBps = Math.round(parseAmount(taxRate) * 100);
  const totals = useMemo(() => previewTotals(lines, parseAmount(discount), taxRateBps), [lines, discount, taxRateBps]);

  const items: QuoteLineItemInput[] = lines
    .filter((l) => l.description.trim())
    .map((l) => ({ description: l.description.trim(), quantity: l.quantity || "1", unitPriceCents: String(parseAmount(l.unitPrice)) }));

  async function handleCreate(send: boolean) {
    if (items.length === 0) {
      toast.error("Ajoutez au moins une ligne.");
      return;
    }
    setPending(true);
    try {
      const quote = await contravoBrowser.createQuote({
        clientId: contravoClientId,
        projectId: contravoProjectId,
        validUntil,
        currency: "XOF",
        discountCents: String(parseAmount(discount)),
        taxRateBps,
        items,
        status: "draft",
      });
      let final = quote;
      if (send) final = await contravoBrowser.transitionQuote(quote.id, { action: "send" });
      if (opportunityId) {
        await linkContravoEntity({ type: "quote", id: opportunityId, contravo_id: final.id }).catch(() => undefined);
      }
      setCreatedId(final.id);
      toast.success(send ? "Devis créé et envoyé." : "Devis brouillon enregistré.");
      if (send) window.open(contravoBrowser.quotePdfHref(final.id), "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la création du devis.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCreatedId(null); }}>
      <DialogTrigger asChild>
        <Button size="lg">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Générer devis express</DialogTitle>
          <DialogDescription>Lignes en FCFA (XOF), TVA en %, remise globale. Envoi Contravo draft → sent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="valid-until">Valide jusqu&apos;au</Label>
              <Input id="valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tva">TVA (%)</Label>
              <Input id="tva" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount">Remise (FCFA)</Label>
              <Input id="discount" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Lignes</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((x) => [...x, emptyLine()])}>
                <Plus aria-hidden className="size-4" /> Ligne
              </Button>
            </div>
            <ul className="space-y-2">
              {lines.map((line) => (
                <li key={line.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_72px_minmax(0,120px)_auto]">
                  <Input placeholder="Description" value={line.description} onChange={(e) => setLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, description: e.target.value } : r)))} />
                  <Input placeholder="Qté" inputMode="decimal" value={line.quantity} onChange={(e) => setLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, quantity: e.target.value } : r)))} />
                  <Input placeholder="Prix unit." inputMode="numeric" value={line.unitPrice} onChange={(e) => setLines((rows) => rows.map((r) => (r.id === line.id ? { ...r, unitPrice: e.target.value } : r)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Supprimer la ligne" disabled={lines.length <= 1} onClick={() => setLines((rows) => rows.filter((r) => r.id !== line.id))}>
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <dl className="grid gap-1 sm:grid-cols-2">
              <div className="flex justify-between sm:block"><dt className="text-muted-foreground">Sous-total</dt><dd className="font-medium">{money(totals.subtotal)}</dd></div>
              <div className="flex justify-between sm:block"><dt className="text-muted-foreground">TVA ({taxRate} %)</dt><dd className="font-medium">{money(totals.tax)}</dd></div>
              <div className="flex justify-between sm:col-span-2 sm:block"><dt className="text-muted-foreground">Total TTC</dt><dd className="font-heading text-xl">{money(totals.total)}</dd></div>
            </dl>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {createdId && (
            <Button type="button" variant="outline" asChild>
              <a href={contravoBrowser.quotePdfHref(createdId)} target="_blank" rel="noopener noreferrer">
                <FileDown aria-hidden /> PDF
              </a>
            </Button>
          )}
          <Button type="button" variant="outline" disabled={pending} onClick={() => handleCreate(false)}>
            {pending ? "Enregistrement…" : "Brouillon"}
          </Button>
          <Button type="button" disabled={pending} onClick={() => handleCreate(true)}>
            {pending ? "Envoi…" : "Créer et envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
