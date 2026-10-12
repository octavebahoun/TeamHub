export const UPLOAD_KINDS = [
  "quote_pdf",
  "contract_pdf",
  "contract_signed_pdf",
  "invoice_pdf",
  "deliverable",
  "expense_receipt",
  "attachment",
] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

export type UploadStatus = "pending" | "uploading" | "scanning" | "clean" | "ready" | "infected" | "failed";

export type UploadRecord = {
  id: string;
  kind: UploadKind;
  name: string;
  size: number;
  mime: string;
  status: UploadStatus;
  download_url?: string | null;
};

const MAX_BYTES = 25 * 1024 * 1024;

const KIND_MIME: Partial<Record<UploadKind, string[]>> = {
  quote_pdf: ["application/pdf"],
  contract_pdf: ["application/pdf"],
  contract_signed_pdf: ["application/pdf"],
  invoice_pdf: ["application/pdf"],
  expense_receipt: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  deliverable: ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/zip"],
  attachment: ["application/pdf", "image/jpeg", "image/png", "image/webp", "audio/webm", "audio/mp4", "video/webm"],
};

export function uploadDownloadAllowed(status: UploadStatus | string | undefined): boolean {
  return status === "clean" || status === "ready";
}

/** URL de téléchargement uniquement si le fichier est sain et prêt. */
export function resolveDownloadHref(record: { status: UploadStatus | string; download_url?: string | null }): string | null {
  if (!uploadDownloadAllowed(record.status)) return null;
  return record.download_url ?? null;
}

export function validateUploadFile(file: File, kind: UploadKind): string | null {
  if (file.size > MAX_BYTES) return "Le fichier dépasse la taille maximale de 25 Mo.";
  const allowed = KIND_MIME[kind];
  if (allowed && !allowed.includes(file.type)) {
    return "Type de fichier non autorisé pour cette catégorie.";
  }
  return null;
}

export type PresignResponse = {
  upload_id: string;
  upload_url: string;
  headers?: Record<string, string>;
};

export type UploadProgress = {
  phase: "presign" | "put" | "complete" | "polling" | "done" | "error";
  progress: number;
  record?: UploadRecord;
  error?: string;
};

export async function presignUpload(input: {
  kind: UploadKind;
  name: string;
  size: number;
  mime: string;
  context?: Record<string, string | number>;
}): Promise<PresignResponse> {
  const res = await fetch("/api/contravo/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? "Impossible de préparer l'envoi du fichier.");
  return data as PresignResponse;
}

export async function completeUpload(uploadId: string): Promise<UploadRecord> {
  const res = await fetch(`/api/contravo/uploads/${encodeURIComponent(uploadId)}/complete`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? "Finalisation de l'envoi impossible.");
  return data as UploadRecord;
}

export async function fetchUpload(uploadId: string): Promise<UploadRecord> {
  const res = await fetch(`/api/contravo/uploads/${encodeURIComponent(uploadId)}`, { headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? "Impossible de lire l'état du fichier.");
  return data as UploadRecord;
}

export type UploadFlowOptions = {
  kind: UploadKind;
  file: File;
  context?: Record<string, string | number>;
  signal?: AbortSignal;
  onProgress?: (p: UploadProgress) => void;
  pollIntervalMs?: number;
};

export async function uploadFileFlow({ kind, file, context, signal, onProgress, pollIntervalMs = 1500 }: UploadFlowOptions): Promise<UploadRecord> {
  const validation = validateUploadFile(file, kind);
  if (validation) throw new Error(validation);

  onProgress?.({ phase: "presign", progress: 0.05 });
  const presign = await presignUpload({ kind, name: file.name, size: file.size, mime: file.type || "application/octet-stream", context });
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  onProgress?.({ phase: "put", progress: 0.2 });
  const putRes = await fetch(presign.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream", ...(presign.headers ?? {}) },
    body: file,
    signal,
  });
  if (!putRes.ok) throw new Error("Échec du transfert du fichier.");

  onProgress?.({ phase: "complete", progress: 0.55 });
  let record = await completeUpload(presign.upload_id);

  while (record.status === "scanning" || record.status === "pending" || record.status === "uploading") {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onProgress?.({ phase: "polling", progress: 0.75, record });
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    record = await fetchUpload(record.id);
  }

  if (record.status === "failed") throw new Error("Le traitement du fichier a échoué.");
  onProgress?.({ phase: "done", progress: 1, record });
  return record;
}
