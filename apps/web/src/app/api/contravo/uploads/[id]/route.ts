import { NextResponse } from "next/server";
import { stubGetRecord } from "@/lib/uploads/stub-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = stubGetRecord(id);
  if (!record) return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });
  return NextResponse.json(record);
}
