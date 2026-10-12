import { contravoFetch, contravoFetchRedirectUrl, useContravoMocks, useLocalBilling } from "./client";
import * as ledger from "./ledger";
import { mocks } from "./mocks";
import { ContravoError, type Invoice, type InvoiceTransition, type ListQuery, type Payment, type RecordPayment } from "./types";

export async function listInvoices(query: ListQuery = {}): Promise<Invoice[]> {
  if (useContravoMocks()) return mocks.listInvoices(query);
  if (await useLocalBilling()) return ledger.listInvoices(query);
  const res = await contravoFetch<{ invoices: Invoice[] }>("/invoices", { query });
  return res.invoices;
}

export async function getInvoice(id: string): Promise<Invoice> {
  if (useContravoMocks()) {
    try {
      return mocks.getInvoice(id);
    } catch {
      throw new ContravoError(404, "Facture introuvable.");
    }
  }
  return contravoFetch<Invoice>(`/invoices/${encodeURIComponent(id)}`);
}

export async function transitionInvoice(id: string, body: InvoiceTransition): Promise<Invoice> {
  if (useContravoMocks()) {
    try {
      return mocks.transitionInvoice(id, body.action);
    } catch {
      throw new ContravoError(404, "Facture introuvable.");
    }
  }
  return contravoFetch<Invoice>(`/invoices/${encodeURIComponent(id)}/transition`, { method: "POST", body });
}

export async function sendInvoiceReminder(id: string): Promise<{ ok: boolean }> {
  if (useContravoMocks()) return mocks.remindInvoice(id);
  if (await useLocalBilling()) return ledger.sendInvoiceReminder(id);
  await contravoFetch(`/invoices/${encodeURIComponent(id)}/reminders`, { method: "POST", body: {} });
  return { ok: true };
}

export async function recordInvoicePayment(id: string, body: RecordPayment): Promise<Payment> {
  if (useContravoMocks()) {
    try {
      return mocks.recordPayment(id, body);
    } catch {
      throw new ContravoError(404, "Facture introuvable.");
    }
  }
  if (await useLocalBilling()) return ledger.recordInvoicePayment(id, body);
  const res = await contravoFetch<{ payment: Payment }>(`/invoices/${encodeURIComponent(id)}/payments`, { method: "POST", body });
  return res.payment;
}

export async function getInvoicePdfDownloadUrl(id: string): Promise<string> {
  if (useContravoMocks()) return mocks.quotePdfUrl(id);
  return contravoFetchRedirectUrl(`/invoices/${encodeURIComponent(id)}/pdf/download`);
}
