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
  return `${apiBase()}/v1/files/${encodeURIComponent(file.id)}/download`;
}

export async function listFiles(params?: { project_id?: number; client_id?: number }): Promise<Attachment[]> {
  if (USE_MOCKS) {
    return mockAttachments.filter((f) => {
      if (params?.project_id != null && f.project_id !== params.project_id) return false;
      if (params?.client_id != null && f.client_id !== params.client_id) return false;
      return true;
    });
  }
  const url = new URL(`${apiBase()}/v1/files`);
  if (params?.project_id != null) url.searchParams.set("project_id", String(params.project_id));
  if (params?.client_id != null) url.searchParams.set("client_id", String(params.client_id));
  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return (await res.json()) as Attachment[];
}

export async function getFile(id: string): Promise<Attachment | null> {
  if (USE_MOCKS) return mockAttachments.find((f) => f.id === id) ?? null;
  const res = await fetch(`${apiBase()}/v1/files/${encodeURIComponent(id)}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return (await res.json()) as Attachment;
}

/** Résout l'URL de téléchargement après lecture du fichier (même règles que `downloadUrl`). */
export async function getDownloadUrl(id: string): Promise<string | null> {
  const file = await getFile(id);
  if (!file) return null;
  return downloadUrl(file);
}
