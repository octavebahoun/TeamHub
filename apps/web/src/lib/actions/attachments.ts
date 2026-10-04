"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import { userFacingError } from "@/lib/errors/user-facing";

export type UploadedAttachment = {
  id: number;
  kind: string;
  name: string;
  size: string;
  status?: string;
  scan_status?: string;
  download_url?: string | null;
};

export async function uploadWineFile(form: FormData): Promise<{ file?: UploadedAttachment; error?: string }> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choisissez un fichier." };
  }

  const projectId = String(form.get("project_id") ?? "").trim();
  const taskId = String(form.get("task_id") ?? "").trim();
  const path = projectId
    ? `projects/${projectId}/attachments`
    : taskId
      ? `tasks/${taskId}/attachments`
      : "attachments";

  const payload = new FormData();
  payload.set("file", file);

  try {
    const created = await api<UploadedAttachment>(path, { method: "POST", body: payload });
    if (projectId) revalidatePath(`/projets/${projectId}`);
    if (taskId) revalidatePath(`/taches/${taskId}`);
    return { file: created };
  } catch (e) {
    if (e instanceof ApiError) return { error: userFacingError(e.message) };
    return { error: userFacingError(e) };
  }
}
