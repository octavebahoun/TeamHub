"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { Client, Opportunity } from "@/lib/api/types";
import { getClients, getOpportunities } from "@/lib/api/endpoints";
import { contravoFetch, useContravoMocks, useLocalBilling } from "@/lib/contravo/client";
import * as ledger from "@/lib/contravo/ledger";
import { ContravoError, type ContravoClient, type Invoice, type Quote } from "@/lib/contravo/types";
import {
  buildCrmItems,
  buildInvoiceItems,
  buildQuoteItems,
  onlyLinkedDocuments,
  sortFollowUps,
  type FollowUpItem,
} from "@/lib/follow-ups";

/** Les montants WINE sont déjà en FCFA ; le brouillon de relance divise par 100. */
function asWholeFrancs(invoices: Invoice[]): Invoice[] {
  const times100 = (value: string | number | null | undefined) => String(Math.round(Number(value) * 100));
  return invoices.map((invoice) => ({
    ...invoice,
    totalCents: times100(invoice.totalCents),
    amountDueCents: times100(invoice.amountDueCents),
    amountPaidCents: times100(invoice.amountPaidCents),
  }));
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Factures et devis réels Contravo uniquement — jamais les mocks. */
async function conversationIdFor(contravoClientId?: string): Promise<string | null> {
  if (!contravoClientId || useContravoMocks()) return null;
  try {
    const res = await contravoFetch<{ conversations: { id: string }[] }>("/conversations", { query: { clientId: contravoClientId } });
    return res.conversations[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function loadContravoDocs(): Promise<{ invoices: Invoice[]; quotes: Quote[]; names: Record<string, string>; channels: Record<string, boolean> }> {
  if (useContravoMocks()) return { invoices: [], quotes: [], names: {}, channels: {} };
  const [invoices, quotes] = await Promise.all([
    safe(async () => (await contravoFetch<{ invoices: Invoice[] }>("/invoices", { query: { limit: 50 } })).invoices ?? [], []),
    safe(async () => (await contravoFetch<{ quotes: Quote[] }>("/quotes", { query: { limit: 50 } })).quotes ?? [], []),
  ]);
  const ids = [...new Set([...invoices.map((i) => i.clientId), ...quotes.map((q) => q.clientId)].filter(Boolean))];
  const names: Record<string, string> = {};
  const channels: Record<string, boolean> = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const c = await contravoFetch<ContravoClient>(`/clients/${encodeURIComponent(id)}`);
        names[id] = c.companyName?.trim() || c.displayName?.trim() || "Client";
      } catch {
        names[id] = "Client";
      }
      channels[id] = Boolean(await conversationIdFor(id));
    })
  );
  return { invoices, quotes, names, channels };
}

export async function loadFollowUps(): Promise<FollowUpItem[]> {
  if (await useLocalBilling()) {
    const [clients, opps, docs] = await Promise.all([
      safe(() => getClients(), [] as Client[]),
      safe(() => getOpportunities(), [] as Opportunity[]),
      safe(() => ledger.listFollowUps(), { invoices: [], quotes: [] }),
    ]);
    const names: Record<string, string> = {};
    for (const c of clients) names[`wine-c-${c.id}`] = c.company?.trim() || c.name;
    const invoices = buildInvoiceItems(asWholeFrancs(docs.invoices), names).map((item) => {
      const source = docs.invoices.find((invoice) => invoice.id === item.invoiceId);
      const projectId = source?.projectId?.replace(/^wine-p-/, "");
      return {
        ...item,
        href: projectId
          ? `/projets/${projectId}#facturation`
          : item.contravoClientId
            ? `/crm/${item.contravoClientId.replace("wine-c-", "")}`
            : "/analytics",
        channel: "Facture WINE",
        sendLabel: "Enregistrer la relance",
      };
    });
    const quotes = buildQuoteItems(docs.quotes, names).map((item) => ({
      ...item,
      href: item.contravoClientId ? `/crm/${item.contravoClientId.replace("wine-c-", "")}` : "/crm",
      canSend: true,
      channel: "Devis WINE",
      sendLabel: "Enregistrer la relance",
    }));
    return sortFollowUps([...invoices, ...quotes, ...buildCrmItems(opps, clients)]).slice(0, 20);
  }
  const [clients, opps, docs] = await Promise.all([
    safe(() => getClients(), [] as Client[]),
    safe(() => getOpportunities(), [] as Opportunity[]),
    loadContravoDocs(),
  ]);
  for (const c of clients) {
    if (c.contravo_client_id && (c.company || c.name)) {
      docs.names[c.contravo_client_id] = c.company?.trim() || c.name;
    }
  }
  const invoices = buildInvoiceItems(onlyLinkedDocuments(docs.invoices, clients), docs.names);
  const quotes = buildQuoteItems(onlyLinkedDocuments(docs.quotes, clients), docs.names).map((q) => ({
    ...q,
    canSend: Boolean(q.contravoClientId && docs.channels[q.contravoClientId]),
  }));
  return sortFollowUps([...invoices, ...quotes, ...buildCrmItems(opps, clients)]).slice(0, 20);
}

export async function sendFollowUp(
  item: FollowUpItem,
  message: string
): Promise<{ ok?: boolean; error?: string }> {
  const text = message.trim();
  if (!text) return { error: "Le message est vide." };

  try {
    if ((await useLocalBilling()) && (item.kind === "invoice" || item.kind === "quote") && item.contravoClientId) {
      if (item.kind === "invoice" && item.invoiceId) await ledger.sendInvoiceReminder(item.invoiceId);
      const threads = await ledger.listConversations(item.contravoClientId);
      const thread = threads[0] ?? (await ledger.openConversation(item.contravoClientId, "whatsapp"));
      await ledger.sendConversationMessage(thread.id, text);
      revalidatePath("/analytics");
      revalidatePath("/crm");
      return { ok: true };
    }

    if (item.kind === "invoice" && item.invoiceId) {
      if (useContravoMocks()) return { error: "L'envoi de relance n'est pas disponible en mode démonstration." };
      await contravoFetch(`/invoices/${encodeURIComponent(item.invoiceId)}/reminders`, { method: "POST", body: {} });
      const conv = await conversationIdFor(item.contravoClientId);
      if (conv) {
        await contravoFetch(`/conversations/${encodeURIComponent(conv)}/messages`, { method: "POST", body: { text } });
      }
      revalidatePath("/analytics");
      return { ok: true };
    }

    if (item.kind === "quote" && item.contravoClientId) {
      const conv = await conversationIdFor(item.contravoClientId);
      if (!conv) return { error: "Aucun canal WhatsApp ou Telegram pour ce client. Copiez le message." };
      await contravoFetch(`/conversations/${encodeURIComponent(conv)}/messages`, { method: "POST", body: { text } });
      revalidatePath("/analytics");
      return { ok: true };
    }

    if (item.kind === "crm" && item.opportunityId && item.wineClientId) {
      if (await useLocalBilling()) {
        const ref = `wine-c-${item.wineClientId}`;
        const threads = await ledger.listConversations(ref);
        const thread = threads[0] ?? (await ledger.openConversation(ref, "whatsapp"));
        await ledger.sendConversationMessage(thread.id, text);
      } else {
        const conv = await conversationIdFor(item.contravoClientId);
        if (conv) {
          await contravoFetch(`/conversations/${encodeURIComponent(conv)}/messages`, { method: "POST", body: { text } });
        }
      }
      await api(`clients/${item.wineClientId}/activities`, { method: "POST", body: { kind: "email", body: text } });
      await api(`opportunities/${item.opportunityId}`, { method: "PATCH", body: { next_follow_up: null } });
      revalidatePath("/analytics");
      revalidatePath("/crm");
      revalidatePath(`/crm/${item.wineClientId}`);
      return { ok: true };
    }
  } catch (e) {
    if (e instanceof ContravoError) return { error: e.message.replace(/^Contravo \d+: /, "") };
    if (e instanceof ApiError) return { error: e.message };
    return { error: "L'envoi a échoué." };
  }

  return { error: "Cette relance ne peut pas être envoyée automatiquement. Copiez le message." };
}
