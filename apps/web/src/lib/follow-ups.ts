import { differenceInCalendarDays } from "date-fns";
import type { Client, Opportunity } from "@/lib/api/types";
import type { Invoice, Quote } from "@/lib/contravo/types";
import { money, toDate } from "@/lib/format";

export type FollowUpKind = "invoice" | "quote" | "crm";

export type FollowUpItem = {
  id: string;
  kind: FollowUpKind;
  client: string;
  channel: string;
  reason: string;
  message: string;
  href: string;
  canSend: boolean;
  sendLabel: string;
  invoiceId?: string;
  quoteId?: string;
  opportunityId?: number;
  wineClientId?: number;
  contravoClientId?: string;
};

export function xofFromCents(cents: string | number | null | undefined): number {
  const n = Number(cents);
  return Number.isFinite(n) ? Math.round(n / 100) : 0;
}

export function clientLabel(c?: { name?: string | null; company?: string | null; displayName?: string | null } | null): string {
  return c?.company?.trim() || c?.displayName?.trim() || c?.name?.trim() || "Client";
}

export function draftInvoiceMessage(client: string, number: string, amountXof: number): string {
  return `Bonjour ${client}, je me permets de revenir vers vous concernant la facture ${number} (${money(amountXof)}). Pouvez-vous confirmer le paiement ? Merci.`;
}

export function draftQuoteMessage(client: string, number: string): string {
  return `Bonjour ${client}, le devis ${number} est toujours en attente. Souhaitez-vous qu’on l’ajuste ou qu’on planifie la suite ?`;
}

export function draftCrmMessage(client: string, title: string): string {
  return `Bonjour ${client}, je reviens vers vous au sujet de « ${title} ». Êtes-vous disponible pour en parler ?`;
}

export function invoiceNeedsFollowUp(invoice: Invoice, now = new Date()): boolean {
  if (invoice.status === "overdue") return true;
  if (invoice.status === "sent" || invoice.status === "partial") {
    const due = toDate(invoice.dueDate);
    return !!due && differenceInCalendarDays(due, now) < 0;
  }
  return false;
}

export function quoteNeedsFollowUp(quote: Quote): boolean {
  return quote.status === "sent" || quote.status === "viewed";
}

export function crmNeedsFollowUp(opp: Opportunity, now = new Date()): boolean {
  if (opp.stage === "won" || opp.stage === "lost" || !opp.next_follow_up) return false;
  const d = toDate(opp.next_follow_up);
  return !!d && differenceInCalendarDays(d, now) <= 0;
}

export function buildInvoiceItems(
  invoices: Invoice[],
  names: Record<string, string>,
  now = new Date()
): FollowUpItem[] {
  return invoices.filter((inv) => invoiceNeedsFollowUp(inv, now)).map((inv) => {
    const client = names[inv.clientId] || "Client";
    const amount = xofFromCents(inv.amountDueCents || inv.totalCents);
    return {
      id: `invoice:${inv.id}`,
      kind: "invoice" as const,
      client,
      channel: "Facture",
      reason: inv.status === "overdue" || invoiceNeedsFollowUp(inv, now) ? `${inv.number} · en retard` : inv.number,
      message: draftInvoiceMessage(client, inv.number, amount),
      href: "https://contravo.excellenceteam.site",
      canSend: true,
      sendLabel: "Envoyer",
      invoiceId: inv.id,
      contravoClientId: inv.clientId,
    };
  });
}

export function buildQuoteItems(quotes: Quote[], names: Record<string, string>): FollowUpItem[] {
  return quotes.filter(quoteNeedsFollowUp).map((q) => {
    const client = names[q.clientId] || "Client";
    const seen = q.status === "viewed" ? "consulté, sans réponse" : "envoyé, sans réponse";
    return {
      id: `quote:${q.id}`,
      kind: "quote" as const,
      client,
      channel: "Devis",
      reason: `${q.number} · ${seen}`,
      message: draftQuoteMessage(client, q.number),
      href: "https://contravo.excellenceteam.site",
      canSend: false,
      sendLabel: "Envoyer",
      quoteId: q.id,
      contravoClientId: q.clientId,
    };
  });
}

export function buildCrmItems(opps: Opportunity[], clients: Client[], now = new Date()): FollowUpItem[] {
  const byId = new Map(clients.map((c) => [c.id, c]));
  return opps.filter((o) => crmNeedsFollowUp(o, now)).map((o) => {
    const wine = o.client ?? byId.get(o.client_id);
    const client = clientLabel(wine);
    return {
      id: `crm:${o.id}`,
      kind: "crm" as const,
      client,
      channel: "CRM",
      reason: o.title,
      message: draftCrmMessage(client, o.title),
      href: `/crm/${o.client_id}`,
      canSend: true,
      sendLabel: "Relance faite",
      opportunityId: o.id,
      wineClientId: o.client_id,
      contravoClientId: wine && "contravo_client_id" in wine ? wine.contravo_client_id ?? undefined : undefined,
    };
  });
}

const KIND_ORDER: Record<FollowUpKind, number> = { invoice: 0, quote: 1, crm: 2 };

export function sortFollowUps(items: FollowUpItem[]): FollowUpItem[] {
  return [...items].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.client.localeCompare(b.client, "fr"));
}
