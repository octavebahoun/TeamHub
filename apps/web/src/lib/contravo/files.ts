import { contravoFetch, useContravoMocks } from "./client";
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
  const res = await contravoFetch<{ deliverables: Awaited<ReturnType<typeof mocks.listDeliverables>> }>(
    `/projects/${encodeURIComponent(projectId)}/deliverables`
  );
  return res.deliverables;
}

export async function listReviews() {
  if (useContravoMocks()) return mocks.listReviews();
  const res = await contravoFetch<{ reviews: ReturnType<typeof mocks.listReviews> }>("/reviews");
  return res.reviews;
}

export async function verifySignature(signatureId: string): Promise<SignatureVerification> {
  if (useContravoMocks()) return mocks.verifySignature(signatureId);
  return contravoFetch<SignatureVerification>(`/verify/signature/${encodeURIComponent(signatureId)}`);
}
