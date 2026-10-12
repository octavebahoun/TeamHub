import "server-only";
import { api, ApiError } from "@/lib/api/client";
import { ContravoError, type Contract, type ConversationSummary, type ConversationThread, type CreateContract, type CreateQuote, type Deliverable, type Invoice, type ListQuery, type Payment, type Quote, type QuoteTransition, type RecordPayment, type Review, type SignatureVerification } from "./types";

async function ledger<T>(path: string, options?: Parameters<typeof api>[1]): Promise<T> {
  try {
    return await api<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError) throw new ContravoError(error.status, error.message);
    throw error;
  }
}

function queryOf(query: ListQuery) {
  return {
    projectId: query.projectId,
    clientId: query.clientId,
    status: query.status,
  };
}

export function listQuotes(query: ListQuery): Promise<Quote[]> {
  return ledger<Quote[]>("billing/quotes", { query: queryOf(query) });
}

export function getQuote(id: string): Promise<Quote> {
  return ledger<Quote>(`billing/quotes/${encodeURIComponent(id)}`);
}

export function createQuote(input: CreateQuote): Promise<Quote> {
  return ledger<Quote>("billing/quotes", { method: "POST", body: input });
}

export function transitionQuote(id: string, body: QuoteTransition): Promise<Quote> {
  return ledger<Quote>(`billing/quotes/${encodeURIComponent(id)}/transition`, { method: "POST", body });
}

export function listInvoices(query: ListQuery): Promise<Invoice[]> {
  return ledger<Invoice[]>("billing/invoices", { query: queryOf(query) });
}

export function recordInvoicePayment(id: string, body: RecordPayment): Promise<Payment> {
  return ledger<Payment>(`billing/invoices/${encodeURIComponent(id)}/payments`, { method: "POST", body });
}

export function sendInvoiceReminder(id: string): Promise<{ ok: boolean }> {
  return ledger<{ ok: boolean }>(`billing/invoices/${encodeURIComponent(id)}/reminders`, { method: "POST" });
}

export function listContracts(query: ListQuery): Promise<Contract[]> {
  return ledger<Contract[]>("billing/contracts", { query: queryOf(query) });
}

export function getContract(id: string): Promise<Contract> {
  return ledger<Contract>(`billing/contracts/${encodeURIComponent(id)}`);
}

export function createContract(input: CreateContract): Promise<Contract> {
  return ledger<Contract>("billing/contracts", { method: "POST", body: input });
}

function numericRef(ref: string, prefix: string): string {
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : ref;
}

export function listDeliverables(projectRef: string): Promise<Deliverable[]> {
  return ledger<Deliverable[]>(`projects/${numericRef(projectRef, "wine-p-")}/deliverables`);
}

export function listConversations(clientId?: string): Promise<ConversationSummary[]> {
  return ledger<ConversationSummary[]>("conversations", { query: { clientId } });
}

export function getConversation(id: string): Promise<ConversationThread> {
  return ledger<ConversationThread>(`conversations/${encodeURIComponent(id)}`);
}

export function openConversation(clientId: string, channel: "whatsapp" | "telegram"): Promise<ConversationThread> {
  return ledger<ConversationThread>("conversations", { method: "POST", body: { clientId, channel } });
}

export function sendConversationMessage(id: string, text: string) {
  return ledger<{ message: ConversationThread["messages"][0]; iaActive: boolean }>(`conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: { text },
  });
}

export function listReviews(): Promise<Review[]> {
  return ledger<Review[]>("reviews");
}

export function verifySignature(token: string): Promise<SignatureVerification> {
  return ledger<SignatureVerification>(`signatures/${encodeURIComponent(token)}`);
}

export function signContract(id: string, signerName: string, signerEmail?: string): Promise<Contract> {
  return ledger<Contract>(`billing/contracts/${encodeURIComponent(id)}/sign`, {
    method: "POST",
    body: { signerName, signerEmail },
  });
}

export function listFollowUps(): Promise<{ invoices: Invoice[]; quotes: Quote[] }> {
  return ledger<{ invoices: Invoice[]; quotes: Quote[] }>("billing/follow-ups");
}
