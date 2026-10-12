"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";
import type { FormState } from "./session";
import { localizeFieldErrors } from "@/lib/validation/fr";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const fields = (e: ApiError) => localizeFieldErrors(e.errors);

function readProject(form: FormData) {
  return {
    name: str(form.get("name")) ?? undefined,
    description: str(form.get("description")),
    status: str(form.get("status")) ?? undefined,
    start_date: str(form.get("start_date")),
    end_date: str(form.get("end_date")),
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
