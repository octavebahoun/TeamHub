"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";
import { prepareProjectBilling } from "./billing";
import type { FormState } from "./session";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const fields = (e: ApiError) => Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]]));

function readClientId(form: FormData): number | null {
  const raw = str(form.get("client_id"));
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function readProject(form: FormData) {
  return {
    name: str(form.get("name")) ?? undefined,
    description: str(form.get("description")),
    status: str(form.get("status")) ?? undefined,
    start_date: str(form.get("start_date")),
    end_date: str(form.get("end_date")),
    client_id: readClientId(form),
  };
}

export async function createProject(_: FormState, form: FormData): Promise<FormState> {
  let project: Project;
  try {
    project = await api<Project>("projects", { method: "POST", body: readProject(form) });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fields(e) };
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath("/projets");
  if (typeof project.id === "number" && readProject(form).client_id) {
    await prepareProjectBilling(project.id);
  }
  redirect(`/projets/${project.id}`);
}

export async function updateProject(id: number, _: FormState, form: FormData): Promise<FormState> {
  try {
    await api(`projects/${id}`, { method: "PATCH", body: readProject(form) });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fields(e) };
    if (e instanceof ApiError) return { error: e.status === 403 ? "Seuls les admins et le responsable du projet peuvent le modifier." : e.message };
    throw e;
  }
  revalidatePath(`/projets/${id}`);
  revalidatePath("/projets");
  if (readProject(form).client_id) {
    const billing = await prepareProjectBilling(id);
    if (billing.error) return { error: `Le projet est enregistré. ${billing.error}` };
  }
  return { ok: true };
}

export async function archiveProject(id: number) {
  await api(`projects/${id}`, { method: "DELETE" });
  revalidatePath("/projets");
  redirect("/projets");
}

export async function addProjectMember(projectId: number, userId: number) {
  try {
    await api(`projects/${projectId}/members`, { method: "POST", body: { user_id: userId } });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/projets/${projectId}`);
  return {};
}

export async function removeProjectMember(projectId: number, userId: number) {
  try {
    await api(`projects/${projectId}/members/${userId}`, { method: "DELETE" });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/projets/${projectId}`);
  return {};
}
