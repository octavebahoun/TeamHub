"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { Task, TaskPriority, TaskStatus } from "@/lib/api/types";

export type TaskFormState = { ok?: boolean; error?: string; fields?: Record<string, string> } | undefined;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);

function refresh(projectId?: number, taskId?: number) {
  revalidatePath("/");
  revalidatePath("/taches");
  if (projectId) revalidatePath(`/projets/${projectId}`);
  if (taskId) revalidatePath(`/taches/${taskId}`);
}

export async function createTask(_: TaskFormState, form: FormData): Promise<TaskFormState> {
  const projectId = Number(form.get("project_id"));
  if (!projectId) return { fields: { project_id: "Choisissez un projet." } };
  try {
    const task = await api<Task>(`projects/${projectId}/tasks`, {
      method: "POST",
      body: {
        title: str(form.get("title")),
        description: str(form.get("description")),
        assignee_id: str(form.get("assignee_id")) ? Number(form.get("assignee_id")) : undefined,
        priority: str(form.get("priority")),
        status: str(form.get("status")),
        due_date: str(form.get("due_date")),
        parent_id: str(form.get("parent_id")) ? Number(form.get("parent_id")) : undefined,
      },
    });
    refresh(projectId, task.parent_id ?? undefined);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError && e.status === 422)
      return { fields: Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])) };
    if (e instanceof ApiError) return { error: e.status === 403 ? "Vous n'avez pas le droit de créer une tâche dans ce projet." : e.message };
    throw e;
  }
}

type TaskPatch = Partial<{
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: number | null;
  due_date: string | null;
  position: number;
}>;

/** Modification ponctuelle (statut, priorité, assignation…) ; renvoie un message d'erreur lisible. */
export async function updateTask(id: number, projectId: number, patch: TaskPatch): Promise<{ error?: string }> {
  try {
    await api(`tasks/${id}`, { method: "PATCH", body: patch });
    refresh(projectId, id);
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 403 ? "Action non autorisée pour votre rôle." : e.message };
    throw e;
  }
}

export async function toggleTaskDone(id: number, projectId: number, done: boolean) {
  return updateTask(id, projectId, { status: done ? "done" : "todo" });
}

export async function deleteTask(id: number, projectId: number) {
  await api(`tasks/${id}`, { method: "DELETE" });
  refresh(projectId);
}

export async function addTaskComment(taskId: number, _: TaskFormState, form: FormData): Promise<TaskFormState> {
  const body = str(form.get("body"));
  if (!body) return { fields: { body: "Écrivez un commentaire." } };
  try {
    await api(`tasks/${taskId}/comments`, { method: "POST", body: { body } });
    revalidatePath(`/taches/${taskId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}
