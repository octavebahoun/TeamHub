import { contravoFetch, contravoFetchRedirectUrl, useContravoMocks } from "./client";
import { mocks } from "./mocks";
import { ContravoError, type CreateQuote, type ListQuery, type Quote, type QuoteTransition } from "./types";

export async function listQuotes(query: ListQuery = {}): Promise<Quote[]> {
  if (useContravoMocks()) return mocks.listQuotes(query);
  const res = await contravoFetch<{ quotes: Quote[] }>("/quotes", { query });
  return res.quotes;
}

export async function getQuote(id: string): Promise<Quote> {
  if (useContravoMocks()) {
    try {
      return mocks.getQuote(id);
    } catch {
      throw new ContravoError(404, "Devis introuvable.");
    }
  }
  return contravoFetch<Quote>(`/quotes/${encodeURIComponent(id)}`);
}

export async function createQuote(input: CreateQuote): Promise<Quote> {
  if (useContravoMocks()) return mocks.createQuote(input);
  return contravoFetch<Quote>("/quotes", { method: "POST", body: input });
}

export async function updateQuote(id: string, input: Partial<CreateQuote>): Promise<Quote> {
  if (useContravoMocks()) {
    const q = mocks.getQuote(id);
    Object.assign(q, input);
    return q;
  }
  return contravoFetch<Quote>(`/quotes/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
}

export async function transitionQuote(id: string, body: QuoteTransition): Promise<Quote> {
  if (useContravoMocks()) {
    try {
      return mocks.transitionQuote(id, body);
    } catch {
      throw new ContravoError(404, "Devis introuvable.");
    }
  }
  return contravoFetch<Quote>(`/quotes/${encodeURIComponent(id)}/transition`, { method: "POST", body });
}

export async function getQuotePdfDownloadUrl(id: string): Promise<string> {
  if (useContravoMocks()) return mocks.quotePdfUrl(id);
  return contravoFetchRedirectUrl(`/quotes/${encodeURIComponent(id)}/pdf/download`);
}
