import { contravoFetch, useContravoMocks } from "./client";
import { mocks } from "./mocks";
import type { ContravoProject, CreateContravoProject, ListQuery } from "./types";

export async function listProjects(query: ListQuery = {}): Promise<ContravoProject[]> {
  if (useContravoMocks()) return query.clientId ? mocks.listClientProjects(query.clientId) : [];
  const res = await contravoFetch<{ projects: ContravoProject[] }>("/projects", { query });
  return res.projects ?? [];
}

export async function createProject(input: CreateContravoProject): Promise<ContravoProject> {
  if (useContravoMocks()) {
    const now = new Date().toISOString();
    return {
      id: mocks.defaultProjectId,
      organizationId: "org",
      clientId: input.clientId,
      code: "PRJ-MOCK",
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "active",
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      deliveredAt: null,
      budgetCents: null,
      currency: input.currency ?? "XOF",
      plannedDeliverables: null,
      ownerUserId: null,
      createdAt: now,
      updatedAt: now,
    };
  }
  return contravoFetch<ContravoProject>("/projects", { method: "POST", body: input });
}
