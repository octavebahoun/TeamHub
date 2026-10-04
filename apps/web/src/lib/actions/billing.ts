"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { Client, Project } from "@/lib/api/types";
import { useContravoMocks } from "@/lib/contravo/client";
import { createClient, findClientByEmail } from "@/lib/contravo/clients";
import { createProject, listProjects } from "@/lib/contravo/projects";
import { billingError, contravoClientPayload, contravoProjectPayload } from "@/lib/contravo/provision";
import { ContravoError } from "@/lib/contravo/types";
import { linkContravoEntity } from "./contravo";

function fail(error: unknown): { error: string } {
  return { error: billingError(error) };
}

async function ensureContravoClient(client: Client): Promise<{ id: string } | { error: string }> {
  if (client.contravo_client_id) return { id: client.contravo_client_id };
  const payload = contravoClientPayload(client);
  if (!payload.ok) return { error: payload.error };
  try {
    const existing = await findClientByEmail(payload.body.email, payload.body.displayName);
    const created = existing ?? (await createClient(payload.body));
    await linkContravoEntity({ type: "client", id: client.id, contravo_id: created.id });
    return { id: created.id };
  } catch (error) {
    return fail(error);
  }
}

async function ensureContravoProject(project: Project, contravoClientId: string): Promise<{ id: string } | { error: string }> {
  if (project.contravo_project_id) return { id: project.contravo_project_id };
  const body = contravoProjectPayload({
    clientId: contravoClientId,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.start_date,
    dueDate: project.end_date,
  });
  try {
    const listed = await listProjects({ clientId: contravoClientId, limit: 50 });
    const same = listed.find((item) => item.name.trim() === body.name);
    const created = same ?? (await createProject(body));
    await linkContravoEntity({ type: "project", id: project.id, contravo_id: created.id });
    return { id: created.id };
  } catch (error) {
    return fail(error);
  }
}

export async function provisionClient(clientId: number, email?: string): Promise<{ error?: string }> {
  if (useContravoMocks()) return {};
  try {
    let client = await api<Client>(`clients/${clientId}`);
    if (!client.email && email?.trim()) {
      client = await api<Client>(`clients/${clientId}`, { method: "PATCH", body: { email: email.trim() } });
    }
    const linked = await ensureContravoClient(client);
    if ("error" in linked) return linked;
    revalidatePath("/crm");
    revalidatePath(`/crm/${clientId}`);
    return {};
  } catch (error) {
    if (error instanceof ApiError || error instanceof ContravoError) return fail(error);
    throw error;
  }
}

export async function prepareProjectBilling(projectId: number, email?: string): Promise<{ error?: string }> {
  if (useContravoMocks()) return {};
  try {
    const project = await api<Project>(`projects/${projectId}`);
    if (!project.client_id) return { error: "Choisissez d'abord un client pour ce projet." };
    let client = await api<Client>(`clients/${project.client_id}`);
    if (!client.email && email?.trim()) {
      client = await api<Client>(`clients/${client.id}`, { method: "PATCH", body: { email: email.trim() } });
    }
    const linkedClient = await ensureContravoClient(client);
    if ("error" in linkedClient) return linkedClient;
    const linkedProject = await ensureContravoProject(project, linkedClient.id);
    if ("error" in linkedProject) return linkedProject;
    revalidatePath("/projets");
    revalidatePath(`/projets/${projectId}`);
    revalidatePath(`/crm/${client.id}`);
    return {};
  } catch (error) {
    if (error instanceof ApiError || error instanceof ContravoError) return fail(error);
    throw error;
  }
}
