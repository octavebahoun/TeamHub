"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";

async function run(path: string, method: "POST" | "PATCH", body: unknown, projectId?: number): Promise<{ error?: string }> {
  try {
    await api(path, { method, body });
    if (projectId) revalidatePath(`/projets/${projectId}`);
    revalidatePath("/social");
    revalidatePath("/crm");
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    return { error: "Enregistrement impossible." };
  }
}

export async function addMilestone(projectId: number, title: string) {
  return run(`projects/${projectId}/milestones`, "POST", { title }, projectId);
}

export async function toggleMilestone(projectId: number, milestoneId: number, done: boolean) {
  return run(`projects/${projectId}/milestones/${milestoneId}`, "PATCH", { done }, projectId);
}

export async function addDeliverable(projectId: number, title: string) {
  return run(`projects/${projectId}/deliverables`, "POST", { title }, projectId);
}

export async function addReview(clientId: number, rating: number, comment: string) {
  const res = await run(`clients/${clientId}/reviews`, "POST", { rating, comment });
  revalidatePath(`/crm/${clientId}`);
  revalidatePath("/");
  return res;
}
