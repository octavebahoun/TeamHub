import { contravoFetch, useContravoMocks } from "./client";
import { mocks } from "./mocks";
import { ContravoError, type ContravoClient, type ContravoProject, type CreateContravoClient, type Invoice } from "./types";

export async function createClient(input: CreateContravoClient): Promise<ContravoClient> {
  if (useContravoMocks()) {
    return { id: mocks.defaultClientId, organizationId: "org", type: input.type, displayName: input.displayName, companyName: input.companyName ?? null, firstName: null, lastName: null, email: input.email, phone: input.phone ?? null, vatNumber: null, notes: input.notes ?? null, tags: [], isArchived: false, createdBy: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  return contravoFetch<ContravoClient>("/clients", { method: "POST", body: input });
}

export async function findClientByEmail(email: string, displayName: string): Promise<ContravoClient | null> {
  if (useContravoMocks()) return null;
  const res = await contravoFetch<{ clients?: ContravoClient[] }>("/clients", { query: { search: displayName, limit: 20 } });
  return (res.clients ?? []).find((c) => c.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

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
