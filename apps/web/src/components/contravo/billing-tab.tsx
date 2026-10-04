"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { prepareProjectBilling } from "@/lib/actions/billing";
import { contravoBrowser } from "@/lib/contravo/browser";
import { CONTRACT_STATUS, INVOICE_STATUS, PAYMENT_METHOD_LABEL, QUOTE_STATUS } from "@/lib/contravo/labels";
import { billingError } from "@/lib/contravo/provision";
import type { Contract, Invoice, Quote } from "@/lib/contravo/types";
import { money, shortDate } from "@/lib/format";
import { CreateContractDialog } from "./create-contract-dialog";
import { GenerateQuoteDialog } from "./generate-quote-dialog";

export function BillingTab({
  wineProjectId,
  wineClientId,
  clientEmail,
  contravoClientId,
  contravoProjectId,
  projectName,
  opportunityId,
}: {
  wineProjectId: number;
  wineClientId?: number | null;
  clientEmail?: string | null;
  contravoClientId?: string;
  contravoProjectId?: string;
  projectName: string;
  opportunityId?: number;
}) {
  const router = useRouter();
  const ready = Boolean(contravoClientId && contravoProjectId);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contractNote, setContractNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(ready);
  const [email, setEmail] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");

  const params: Record<string, string> = {};
  if (contravoClientId) params.clientId = contravoClientId;
  if (contravoProjectId) params.projectId = contravoProjectId;

  const load = useCallback(async () => {
    if (!contravoClientId || !contravoProjectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [q, c, i] = await Promise.all([
      contravoBrowser.listQuotes(params).catch((e) => {
        toast.error(billingError(e));
        return [] as Quote[];
      }),
      contravoBrowser.listContracts(params).then((rows) => {
        setContractNote(null);
        return rows;
      }).catch((e) => {
        setContractNote(billingError(e));
        return [] as Contract[];
      }),
      contravoBrowser.listInvoices(params).catch((e) => {
        toast.error(billingError(e));
        return [] as Invoice[];
      }),
    ]);
    setQuotes(q);
    setContracts(c);
    setInvoices(i);
    setLoading(false);
  }, [contravoClientId, contravoProjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remind(id: string) {
    try {
      await contravoBrowser.remindInvoice(id);
      toast.success("Relance envoyée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Relance impossible.");
    }
  }

  async function recordMoMo(id: string) {
    const amount = Number(payAmount.replace(/\s/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    try {
      await contravoBrowser.recordPayment(id, { amountCents: String(amount), method: "mobile_money", reference: payRef || "MoMo" });
      toast.success("Paiement enregistré.");
      setPayInvoiceId(null);
      setPayAmount("");
      setPayRef("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  }

  async function prepare() {
    setPreparing(true);
    const res = await prepareProjectBilling(wineProjectId, email);
    setPreparing(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("La facturation est prête.");
    router.refresh();
  }

  if (!ready) {
    return (
      <Panel className="p-7">
        <PanelTitle className="mb-4">Facturation</PanelTitle>
        {wineClientId ? (
          <div className="space-y-4">
            <p>
              {contravoClientId
                ? "Le projet n'est pas encore relié à la facturation. Préparez-le pour créer un devis ou un contrat."
                : "Ce client n'est pas encore relié à la facturation. Une fois le lien créé, vous pourrez faire un devis et un contrat."}
            </p>
            {!clientEmail && (
              <div className="max-w-sm space-y-1.5">
                <Label htmlFor="project-billing-email">Email du client</Label>
                <Input id="project-billing-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            )}
            <Button type="button" disabled={preparing} onClick={() => void prepare()}>
              {preparing ? "Préparation…" : "Préparer la facturation"}
            </Button>
          </div>
        ) : (
          <p>Ce projet n&apos;a pas encore de client. Ouvrez Modifier et choisissez-le pour préparer un devis ou un contrat.</p>
        )}
      </Panel>
    );
  }

  if (loading) return <p className="text-muted-foreground">Chargement de la facturation…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <GenerateQuoteDialog
          contravoClientId={contravoClientId!}
          contravoProjectId={contravoProjectId!}
          opportunityId={opportunityId}
          defaultTitle={projectName}
        />
        <CreateContractDialog
          wineProjectId={wineProjectId}
          contravoClientId={contravoClientId!}
          contravoProjectId={contravoProjectId!}
          projectName={projectName}
          quotes={quotes}
        />
      </div>
      <Panel className="p-7">
        <PanelTitle className="mb-4">Devis</PanelTitle>
        {quotes.length === 0 ? (
          <p className="text-muted-foreground">Aucun devis Contravo.</p>
        ) : (
          <ul className="divide-y border-t">
            {quotes.map((q) => {
              const st = QUOTE_STATUS[q.status];
              return (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold">{q.number}</p>
                    <p className="text-sm text-muted-foreground">{money(q.totalCents)} · valide {shortDate(q.validUntil)}</p>
                  </div>
                  <ToneBadge tone={st.tone}>{st.label}</ToneBadge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel className="p-7">
        <PanelTitle className="mb-4">Contrats</PanelTitle>
        {contractNote ? (
          <p className="text-muted-foreground">{contractNote}</p>
        ) : contracts.length === 0 ? (
          <p className="text-muted-foreground">Aucun contrat.</p>
        ) : (
          <ul className="divide-y border-t">
            {contracts.map((c) => {
              const st = CONTRACT_STATUS[c.status];
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-sm text-muted-foreground">{c.number}</p>
                  </div>
                  <ToneBadge tone={st.tone}>{st.label}</ToneBadge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel className="p-7">
        <PanelTitle className="mb-4">Factures</PanelTitle>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground">Aucune facture.</p>
        ) : (
          <ul className="divide-y border-t">
            {invoices.map((inv) => {
              const st = INVOICE_STATUS[inv.status];
              return (
                <li key={inv.id} className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{inv.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {money(inv.totalCents)} · dû {money(inv.amountDueCents)} · échéance {shortDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ToneBadge tone={st.tone}>{st.label}</ToneBadge>
                      {inv.status !== "paid" && (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => remind(inv.id)}>
                            <Bell aria-hidden className="size-4" /> Relancer
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => { setPayInvoiceId(inv.id); setPayAmount(String(inv.amountDueCents)); }}>
                            <Smartphone aria-hidden className="size-4" /> MoMo
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {payInvoiceId === inv.id && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="mb-3 text-sm font-medium">Paiement manuel · {PAYMENT_METHOD_LABEL.mobile_money}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`amt-${inv.id}`}>Montant (FCFA)</Label>
                          <Input id={`amt-${inv.id}`} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} inputMode="numeric" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`ref-${inv.id}`}>Référence MoMo</Label>
                          <Input id={`ref-${inv.id}`} value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="TXN-…" />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button type="button" size="sm" onClick={() => recordMoMo(inv.id)}>Enregistrer</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setPayInvoiceId(null)}>Annuler</Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
