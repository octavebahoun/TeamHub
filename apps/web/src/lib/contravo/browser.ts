"use client";

import type {
  Contract,
  ConversationSummary,
  CreateContract,
  ConversationThread,
  CreateQuote,
  Invoice,
  Payment,
  Quote,
  QuoteTransition,
  RecordPayment,
} from "./types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { Accept: "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message ?? "Erreur Contravo.");
  return data as T;
}

export const contravoBrowser = {
  listQuotes(params?: Record<string, string>) {
    const q = params ? `?${new URLSearchParams(params)}` : "";
    return api<Quote[]>(`/api/contravo/quotes${q}`);
  },
  getQuote(id: string) {
    return api<Quote>(`/api/contravo/quotes/${encodeURIComponent(id)}`);
  },
  createQuote(body: CreateQuote) {
    return api<Quote>("/api/contravo/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  },
  transitionQuote(id: string, body: QuoteTransition) {
    return api<Quote>(`/api/contravo/quotes/${encodeURIComponent(id)}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  quotePdfHref(id: string) {
    return `/api/contravo/quotes/${encodeURIComponent(id)}/pdf`;
  },
  listInvoices(params?: Record<string, string>) {
    const q = params ? `?${new URLSearchParams(params)}` : "";
    return api<Invoice[]>(`/api/contravo/invoices${q}`);
  },
  getInvoice(id: string) {
    return api<Invoice>(`/api/contravo/invoices/${encodeURIComponent(id)}`);
  },
  transitionInvoice(id: string, action: "send" | "cancel" | "refund" | "mark_overdue") {
    return api<Invoice>(`/api/contravo/invoices/${encodeURIComponent(id)}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  },
  remindInvoice(id: string) {
    return api<{ ok: boolean }>(`/api/contravo/invoices/${encodeURIComponent(id)}/reminders`, { method: "POST" });
  },
  recordPayment(id: string, body: RecordPayment) {
    return api<Payment>(`/api/contravo/invoices/${encodeURIComponent(id)}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  listContracts(params?: Record<string, string>) {
    const q = params ? `?${new URLSearchParams(params)}` : "";
    return api<Contract[]>(`/api/contravo/contracts${q}`);
  },
  createContract(body: CreateContract) {
    return api<Contract>("/api/contravo/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
  getClientEnrichment(clientId: string) {
    return api<{ quotes: Quote[]; invoices: Invoice[]; projects: { id: string; name: string; status: string; budgetCents: string | null }[] }>(
      `/api/contravo/clients/${encodeURIComponent(clientId)}/enrichment`
    );
  },
  listConversations(params?: Record<string, string>) {
    const q = params ? `?${new URLSearchParams(params)}` : "";
    return api<ConversationSummary[]>(`/api/contravo/conversations${q}`);
  },
  getConversation(id: string) {
    return api<ConversationThread>(`/api/contravo/conversations/${encodeURIComponent(id)}`);
  },
  sendMessage(conversationId: string, text: string) {
    return api<{ message: ConversationThread["messages"][0]; iaActive: boolean }>(
      `/api/contravo/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }
    );
  },
  listDeliverables(projectId: string) {
    return api<import("./types").Deliverable[]>(`/api/contravo/projects/${encodeURIComponent(projectId)}/deliverables`);
  },
  listReviews() {
    return api<import("./types").Review[]>(`/api/contravo/reviews`);
  },
};
