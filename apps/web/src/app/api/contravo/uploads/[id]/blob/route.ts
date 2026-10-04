import { NextResponse } from "next/server";
import { stubSaveBlob } from "@/lib/uploads/stub-store";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buf = await request.arrayBuffer();
  stubSaveBlob(id, buf);
  return new NextResponse(null, { status: 204 });
}
