import { contravoFetch, useContravoMocks } from "./client";
import { mocks } from "./mocks";
import { ContravoError, type ContravoClient, type ContravoProject, type Invoice } from "./types";

export async function getClient(id: string): Promise<ContravoClient> {
  if (useContravoMocks()) {
    try {
      return mocks.getClient(id);
    } catch {
      throw new ContravoError(404, "Client Contravo introuvable.");
    }
  }
  return contravoFetch<ContravoClient>(`/clients/${encodeURIComponent(id)}`);
}

export async function listClientProjects(id: string): Promise<ContravoProject[]> {
  if (useContravoMocks()) return mocks.listClientProjects(id);
  const res = await contravoFetch<{ projects: ContravoProject[] }>(`/clients/${encodeURIComponent(id)}/projects`);
  return res.projects;
}

export async function listClientInvoices(id: string): Promise<Invoice[]> {
  if (useContravoMocks()) return mocks.listClientInvoices(id);
  const res = await contravoFetch<{ invoices: Invoice[] }>(`/clients/${encodeURIComponent(id)}/invoices`);
  return res.invoices;
}

export async function listClientQuotes(id: string) {
  const { listQuotes } = await import("./quotes");
  return listQuotes({ clientId: id });
}
