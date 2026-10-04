import { NextResponse } from "next/server";
import { uploadDownloadAllowed } from "@/lib/uploads/client";
import { stubGetBlob, stubGetRecord } from "@/lib/uploads/stub-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = stubGetRecord(id);
  if (!record) return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });
  if (!uploadDownloadAllowed(record.status)) {
    return NextResponse.json({ message: "Téléchargement indisponible pour ce fichier." }, { status: 403 });
  }
  const blob = stubGetBlob(id);
  if (!blob) return NextResponse.json({ message: "Contenu non disponible." }, { status: 404 });
  return new NextResponse(blob, {
    headers: {
      "Content-Type": record.mime,
      "Content-Disposition": `attachment; filename="${record.name.replace(/"/g, "")}"`,
    },
  });
}
