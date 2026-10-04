import { attachmentDownloadPath } from "@/lib/api/wine-contract";
import { USE_MOCKS } from "@/lib/data/mode";
import { mockAttachments } from "@/lib/data/mocks/files";
import type { Attachment, AttachmentStatus } from "@/lib/data/types";

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

const DOWNLOADABLE: ReadonlySet<AttachmentStatus> = new Set(["clean", "ready"]);

/**
 * URL de téléchargement uniquement pour fichiers `clean` ou `ready`.
 * Jamais pour `infected`, `pending` ou `scanning`.
 */
export function downloadUrl(file: Attachment): string | null {
  if (file.status === "infected") return null;
  if (!DOWNLOADABLE.has(file.status)) return null;
  if (USE_MOCKS) {
    return `/mock/fichiers/${encodeURIComponent(file.id)}/${encodeURIComponent(file.name)}`;
  }
  const path = attachmentDownloadPath(file.status, file.id);
  return path ? `${apiBase()}${path}` : null;
}

export async function listFiles(params?: { project_id?: number; client_id?: number }): Promise<Attachment[]> {
  if (USE_MOCKS) {
    return mockAttachments.filter((f) => {
      if (params?.project_id != null && f.project_id !== params.project_id) return false;
      if (params?.client_id != null && f.client_id !== params.client_id) return false;
      return true;
    });
  }
  void params;
  throw new Error("Les pièces jointes se lisent sur le projet ou la tâche. Il n'y a pas de GET /v1/files.");
}

export async function getFile(id: string): Promise<Attachment | null> {
  if (USE_MOCKS) return mockAttachments.find((f) => f.id === id) ?? null;
  void id;
  return null;
}

/** Résout l'URL de téléchargement après lecture du fichier (même règles que `downloadUrl`). */
export async function getDownloadUrl(id: string): Promise<string | null> {
  const file = await getFile(id);
  if (!file) return null;
  return downloadUrl(file);
}
