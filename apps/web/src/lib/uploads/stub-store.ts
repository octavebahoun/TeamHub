import type { UploadRecord } from "@/lib/uploads/client";

const blobs = new Map<string, ArrayBuffer>();
const records = new Map<string, UploadRecord & { infected?: boolean }>();

export function stubSaveBlob(id: string, data: ArrayBuffer) {
  blobs.set(id, data);
}

export function stubGetBlob(id: string) {
  return blobs.get(id);
}

export function stubSetMeta(id: string, partial: Partial<UploadRecord> & { infected?: boolean }) {
  const prev = records.get(id);
  records.set(id, {
    id,
    kind: partial.kind ?? prev?.kind ?? "attachment",
    name: partial.name ?? prev?.name ?? "fichier",
    size: partial.size ?? prev?.size ?? 0,
    mime: partial.mime ?? prev?.mime ?? "application/octet-stream",
    status: partial.status ?? prev?.status ?? "pending",
    download_url: partial.download_url ?? prev?.download_url ?? null,
    infected: partial.infected ?? prev?.infected,
  });
}

export function stubGetRecord(id: string): UploadRecord | undefined {
  const m = records.get(id);
  if (!m) return undefined;
  const { infected, ...record } = m;
  return record;
}

export function stubMarkScanComplete(id: string) {
  const m = records.get(id);
  if (!m) return;
  const infected = m.infected || m.name.toLowerCase().includes("eicar");
  records.set(id, {
    ...m,
    status: infected ? "infected" : "ready",
    download_url: infected ? null : `/api/contravo/uploads/${id}/download`,
  });
}
