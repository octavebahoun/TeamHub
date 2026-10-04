"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { ActivityKind, Client, Opportunity, OpportunityStage } from "@/lib/api/types";
import { prepareProjectBilling, provisionClient } from "./billing";
import type { FormState } from "./session";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const fields = (e: ApiError) => Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]]));
const refresh = (clientId?: number) => {
  revalidatePath("/crm");
  revalidatePath("/crm/pipeline");
  if (clientId) revalidatePath(`/crm/${clientId}`);
};

export async function createClient(_: FormState, form: FormData): Promise<FormState> {
  let client: Client;
  try {
    client = await api<Client>("clients", {
      method: "POST",
      body: {
        company: str(form.get("company")),
        name: str(form.get("name")),
        email: str(form.get("email")),
        phone: str(form.get("phone")),
        address: str(form.get("address")),
        notes: str(form.get("notes")),
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fields(e) };
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  refresh();
  if (typeof client.id === "number") await provisionClient(client.id);
  redirect(`/crm/${client.id}`);
}

export async function createOpportunity(_: FormState, form: FormData): Promise<FormState> {
  const clientId = Number(form.get("client_id"));
  try {
    await api<Opportunity>("opportunities", {
      method: "POST",
      body: {
        client_id: clientId || null,
        title: str(form.get("title")),
        amount: str(form.get("amount")) ? Number(String(form.get("amount")).replace(/\s/g, "")) : null,
        stage: str(form.get("stage")) ?? "prospect",
        next_follow_up: str(form.get("next_follow_up")),
        notes: str(form.get("notes")),
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fields(e) };
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  refresh(clientId);
  return { ok: true };
}

/** Changement d'étape ou de date de relance. Une opportunité gagnée crée le projet côté API. */
export async function updateOpportunity(
  id: number,
  clientId: number,
  patch: Partial<{ stage: OpportunityStage; next_follow_up: string | null; amount: number; title: string }>
): Promise<{ error?: string; project?: { id: number; name: string } | null }> {
  try {
    const opp = await api<Opportunity>(`opportunities/${id}`, { method: "PATCH", body: patch });
    refresh(clientId);
    if (patch.stage === "won") {
      revalidatePath("/projets");
      if (opp.project?.id) await prepareProjectBilling(opp.project.id).catch(() => undefined);
    }
    return { project: opp.project ?? null };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 403 ? "Seul le responsable de l'opportunité peut la modifier." : e.message };
    throw e;
  }
}

export async function logActivity(clientId: number, _: FormState, form: FormData): Promise<FormState> {
  const body = str(form.get("body"));
  if (!body) return { fields: { body: "Décrivez l'échange." } };
  try {
    await api(`clients/${clientId}/activities`, { method: "POST", body: { kind: (str(form.get("kind")) ?? "note") as ActivityKind, body } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return { error: "L'historique n'est pas encore disponible sur ce serveur." };
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/crm/${clientId}`);
  return { ok: true };
}
