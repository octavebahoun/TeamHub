import { api } from "@/lib/api/client";
import { contravoFetch, useContravoMocks, useLocalBilling } from "./client";
import * as ledger from "./ledger";
import { mocks } from "./mocks";
import {
  ContravoError,
  type ContravoFile,
  type FileDownload,
  type PresignUploadInput,
  type PresignUploadResult,
  type SignatureVerification,
} from "./types";

export async function presignUpload(input: PresignUploadInput): Promise<PresignUploadResult> {
  if (useContravoMocks()) return mocks.presignUpload(input);
  return contravoFetch<PresignUploadResult>("/uploads/presign", { method: "POST", body: input });
}

export async function completeUpload(id: string): Promise<ContravoFile> {
  if (useContravoMocks()) {
    try {
      return mocks.completeUpload(id);
    } catch {
      throw new ContravoError(404, "Fichier introuvable.");
    }
  }
  return contravoFetch<ContravoFile>(`/uploads/${encodeURIComponent(id)}/complete`, { method: "POST", body: {} });
}

export async function getFileDownload(id: string): Promise<FileDownload> {
  if (useContravoMocks()) {
    try {
      return mocks.downloadFile(id);
    } catch {
      throw new ContravoError(404, "Fichier introuvable.");
    }
  }
  return contravoFetch<FileDownload>(`/files/${encodeURIComponent(id)}/download`);
}

export async function listProjectDeliverables(projectId: string) {
  if (useContravoMocks()) return mocks.listDeliverables(projectId);
  if ((await useLocalBilling()) || projectId.startsWith("wine-p-")) return ledger.listDeliverables(projectId);
  const res = await contravoFetch<{ deliverables: Awaited<ReturnType<typeof mocks.listDeliverables>> }>(
    `/projects/${encodeURIComponent(projectId)}/deliverables`
  );
  return res.deliverables;
}

export async function listReviews() {
  if (useContravoMocks()) return mocks.listReviews();
  if (await useLocalBilling()) return ledger.listReviews();
  try {
    const res = await contravoFetch<{ reviews: ReturnType<typeof mocks.listReviews> }>("/reviews");
    return res.reviews;
  } catch (error) {
    if (error instanceof ContravoError && (error.status === 403 || error.status === 404)) return [];
    throw error;
  }
}

export async function verifySignature(signatureId: string): Promise<SignatureVerification> {
  if (useContravoMocks()) return mocks.verifySignature(signatureId);
  try {
    const local = await api<SignatureVerification>(`signatures/${encodeURIComponent(signatureId)}`, { anonymous: true });
    if (local.valid || (await useLocalBilling())) return local;
  } catch {
    if (await useLocalBilling()) {
      return { valid: false, signedAt: null, signerName: null, documentNumber: null, signatureHash: null };
    }
  }
  return contravoFetch<SignatureVerification>(`/verify/signature/${encodeURIComponent(signatureId)}`);
}
