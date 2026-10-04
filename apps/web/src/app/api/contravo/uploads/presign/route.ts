import { NextResponse } from "next/server";
import { files, useContravoMocks } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";
import { UPLOAD_KINDS, type UploadKind } from "@/lib/uploads/client";
import { stubSetMeta } from "@/lib/uploads/stub-store";

export async function POST(request: Request) {
  const denied = await requireWineSession();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as {
    kind?: UploadKind;
    name?: string;
    size?: number;
    mime?: string;
    context?: Record<string, string | number>;
  } | null;

  if (!body?.kind || !UPLOAD_KINDS.includes(body.kind)) {
    return NextResponse.json({ message: "Type de document invalide." }, { status: 422 });
  }
  if (!body.name || typeof body.size !== "number" || body.size <= 0) {
    return NextResponse.json({ message: "Fichier invalide." }, { status: 422 });
  }

  const mime = body.mime ?? "application/octet-stream";

  if (!useContravoMocks()) {
    try {
      const presign = await files.presignUpload({
        kind: body.kind,
        filename: body.name,
        mimeType: mime,
        sizeBytes: body.size,
        linkedEntityType: body.context?.linkedEntityType as "quote" | "contract" | "invoice" | undefined,
        linkedEntityId: body.context?.linkedEntityId ? String(body.context.linkedEntityId) : undefined,
      });
      return NextResponse.json({
        upload_id: presign.fileId,
        upload_url: presign.uploadUrl,
        headers: {
          "Content-Type": presign.requiredHeaders["content-type"],
          "Content-Length": presign.requiredHeaders["content-length"],
        },
      });
    } catch (e) {
      return contravoRouteError(e);
    }
  }

  const upload_id = crypto.randomUUID();
  const origin = new URL(request.url).origin;

  stubSetMeta(upload_id, {
    kind: body.kind,
    name: body.name,
    size: body.size,
    mime,
    status: "pending",
    download_url: null,
  });

  return NextResponse.json({
    upload_id,
    upload_url: `${origin}/api/contravo/uploads/${upload_id}/blob`,
    headers: { "Content-Type": mime },
  });
}
