import { NextResponse } from "next/server";
import { files, useContravoMocks } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";
import type { UploadRecord } from "@/lib/uploads/client";
import { stubGetRecord, stubMarkScanComplete, stubSetMeta } from "@/lib/uploads/stub-store";

function toUploadRecord(f: { id: string; kind: string; filename: string; sizeBytes: string; mimeType: string; status: string }): UploadRecord {
  const status = f.status === "clean" || f.status === "ready" ? f.status : f.status === "infected" ? "infected" : "scanning";
  return {
    id: f.id,
    kind: f.kind as UploadRecord["kind"],
    name: f.filename,
    size: Number(f.sizeBytes) || 0,
    mime: f.mimeType,
    status,
    download_url: status === "clean" || status === "ready" ? `/api/contravo/files/${f.id}/download` : null,
  };
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireWineSession();
  if (denied) return denied;

  const { id } = await params;

  if (!useContravoMocks()) {
    try {
      const file = await files.completeUpload(id);
      return NextResponse.json(toUploadRecord(file));
    } catch (e) {
      return contravoRouteError(e);
    }
  }
  stubSetMeta(id, { status: "scanning", download_url: null });
  const base = stubGetRecord(id);
  const record: UploadRecord = base ?? {
    id,
    kind: "attachment",
    name: "fichier",
    size: 0,
    mime: "application/octet-stream",
    status: "scanning",
    download_url: null,
  };

  queueMicrotask(async () => {
    await new Promise((r) => setTimeout(r, 400));
    stubMarkScanComplete(id);
  });

  return NextResponse.json({ ...record, status: "scanning" as const });
}
